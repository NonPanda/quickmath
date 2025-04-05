# predict.py
import numpy as np
import tensorflow as tf

import cv2
import sys 


MODEL_PATH = './cnn/saved_model/digit_model.h5'

def load_model(model_path=MODEL_PATH):
    """
    Load the trained model from the specified path.

    Returns:
        The loaded model
    """
    try:
        model = tf.keras.models.load_model(model_path)
        print(f"Model loaded successfully from {model_path}", file=sys.stderr)
        return model
    except Exception as e:
        print(f"Error loading model from {model_path}: {e}", file=sys.stderr) 
        return None

def preprocess_image(image_path, resize_dim=None):
    """
    Preprocess an image for better text detection/OCR accuracy.

    Args:
        image_path (str): Path to the input image
        resize_dim (tuple, optional): Dimensions (width, height) to resize the image to

    Returns:
        Preprocessed image or None if processing failed
    """
    try:
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

        if image is None:
            print(f"Error: Could not read image at {image_path}", file=sys.stderr) 
            return None

        if resize_dim is not None:
            image = cv2.resize(image, resize_dim, interpolation=cv2.INTER_CUBIC)

        mean_val = np.mean(image)
        if mean_val < 80: image = cv2.convertScaleAbs(image, alpha=1.5, beta=30)
        elif mean_val > 200: image = cv2.convertScaleAbs(image, alpha=0.8, beta=-20)

        blurred = cv2.bilateralFilter(image, 9, 75, 75)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(blurred)

        block_sizes = [11, 15, 21]
        best_thresh = None
        best_score = -1
        for block_size in block_sizes:
            thresh = cv2.adaptiveThreshold(
                enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV, block_size, 4
            )
            temp_kernel = np.ones((2, 2), np.uint8)
            temp_opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, temp_kernel)
            score = cv2.countNonZero(temp_opening)
            if best_thresh is None or (score > 0 and score < best_score or best_score == -1):
                best_thresh = thresh
                best_score = score
        thresh = best_thresh

        kernel_open = np.ones((2, 2), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_open)
        kernel_close = np.ones((3, 3), np.uint8)
        processed = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, kernel_close)
        kernel_final = np.ones((2, 2), np.uint8)
        final = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel_final)

        return final

    except Exception as e:
        print(f"Error processing image: {str(e)}", file=sys.stderr) # Error to stderr
        return None

def segment_digits(image):
    """
    Segment individual digits from a preprocessed image while preserving digit integrity.

    Args:
        image: Preprocessed binary image

    Returns:
        List of segmented and normalized digit images
    """
    original = image.copy()

    denoised1 = cv2.medianBlur(image, 3)
    kernel2 = np.ones((2, 2), np.uint8)
    denoised2 = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel2)
    contours1, _ = cv2.findContours(denoised1, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours2, _ = cv2.findContours(denoised2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    min_area = 80
    filtered1 = [c for c in contours1 if cv2.contourArea(c) > min_area]
    filtered2 = [c for c in contours2 if cv2.contourArea(c) > min_area]

    if 1 <= len(filtered1) <= 10:
        filtered_contours = filtered1
    elif 1 <= len(filtered2) <= 10:
        filtered_contours = filtered2
    else:
        filtered_contours = filtered1 if len(filtered1) > len(filtered2) else filtered2

    if len(filtered_contours) < 1:
        edges = cv2.Canny(original, 30, 200)
        dilated_edges = cv2.dilate(edges, np.ones((2, 2), np.uint8), iterations=1)
        contours, _ = cv2.findContours(dilated_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        filtered_contours = [c for c in contours if cv2.contourArea(c) > min_area]

    if filtered_contours:
        bounding_boxes = [cv2.boundingRect(contour) for contour in filtered_contours]
        valid_boxes = []
        for i, (x, y, w, h) in enumerate(bounding_boxes):
            aspect_ratio = w / h if h > 0 else 0
            if 0.25 <= aspect_ratio <= 1.5 and h >= 8:
                valid_boxes.append((i, (x, y, w, h)))
        if valid_boxes:
            indices, bounding_boxes = zip(*valid_boxes)
            filtered_contours = [filtered_contours[i] for i in indices]
        else:
            bounding_boxes = [cv2.boundingRect(contour) for contour in filtered_contours]

        if filtered_contours and bounding_boxes:
           try:
              sorted_pairs = sorted(zip(filtered_contours, bounding_boxes), key=lambda b: b[1][0])
              filtered_contours, bounding_boxes = zip(*sorted_pairs)
           except ValueError:
               print("Warning: Could not sort contours/bounding boxes.", file=sys.stderr)
               return []
        else:
           return []
    else:
        return []

    digit_images = []
    for i, (x, y, w, h) in enumerate(bounding_boxes):
        pad = 2
        x_start = max(0, x - pad)
        y_start = max(0, y - pad)
        x_end = min(original.shape[1], x + w + pad)
        y_end = min(original.shape[0], y + h + pad)

        digit = original[y_start:y_end, x_start:x_end]

        black_pixel_ratio = np.sum(digit > 0) / (digit.shape[0] * digit.shape[1]) if (digit.shape[0] * digit.shape[1]) > 0 else 0
        padding = 6 if black_pixel_ratio > 0.5 else 8
        aspect = w / h if h > 0 else 1

        if aspect < 0.8: target_h, target_w = 20, max(8, int(20 * aspect))
        elif aspect > 1.2: target_w, target_h = 20, max(8, int(20 / aspect))
        else: target_w = target_h = 18

        try:
            if target_w > 0 and target_h > 0: 
                 resized = cv2.resize(digit, (target_w, target_h), interpolation=cv2.INTER_AREA)
            else:
                 print(f"Warning: Skipping digit {i} due to invalid resize dimensions ({target_w}x{target_h})", file=sys.stderr)
                 continue
        except Exception as resize_err:
            print(f"Warning: Resizing failed for digit {i}: {resize_err}", file=sys.stderr)
            continue 

        normalized = np.zeros((28, 28), dtype=np.uint8)
        offset_x = (28 - target_w) // 2
        offset_y = (28 - target_h) // 2
        normalized[offset_y:offset_y+target_h, offset_x:offset_x+target_w] = resized
        _, normalized = cv2.threshold(normalized, 90, 255, cv2.THRESH_BINARY)

        digit_images.append(normalized)


    return digit_images

def predict_digit(digit_image, model):
    """
    Predict a single digit.

    Args:
        digit_image: 28x28 numpy array containing a digit
        model: Trained model

    Returns:
        Predicted digit and confidence
    """
    img_array = digit_image.astype('float32') / 255.0
    img_array = img_array.reshape(1, 28, 28, 1)
    prediction = model.predict(img_array, verbose=0)
    digit = np.argmax(prediction[0])
    confidence = float(prediction[0][digit])
    return digit, confidence

def predict_multiple_digits(image_path, model=None):
    """
    Predict multiple digits from an image.

    Args:
        image_path: Path to the image file
        model: Pre-loaded model (optional)

    Returns:
        Dictionary containing recognition results or error
    """
    if model is None:
        model = load_model()
        if model is None:
            return {'error': 'Failed to load model'}

    image = preprocess_image(image_path)
    if image is None:
        return {'error': 'Failed to process image'}

    digit_images = segment_digits(image)
    if not digit_images:
        print("Initial segmentation failed, trying alternative approach...", file=sys.stderr)
        return {'error': 'No digits found in the image'}

    results = []
    for i, digit_image in enumerate(digit_images):
        digit, confidence = predict_digit(digit_image, model)
        results.append({
            'position': i,
            'digit': int(digit),
            'confidence': confidence
        })

    number = ''.join(str(result['digit']) for result in results)

    return {
        'full_number': number,
        'digits': results,
        'digit_count': len(results)
    }

def visualize_segmentation(image_path, output_path='segmentation_visualization.png'):
    """
    Create a visualization of the digit segmentation process.
    """
    original = cv2.imread(image_path)
    gray = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
    if np.mean(gray) > 127:
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    else:
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
         print("No contours found for visualization.", file=sys.stderr)
         return
    bounding_boxes = [cv2.boundingRect(contour) for contour in contours]
    try:
       (contours, bounding_boxes) = zip(*sorted(zip(contours, bounding_boxes), key=lambda b: b[1][0]))
    except ValueError:
        print("Could not sort contours for visualization.", file=sys.stderr)
        return

    visualization = original.copy()
    for i, contour in enumerate(contours):
        x, y, w, h = cv2.boundingRect(contour)
        if w > 8 and h > 8:
            cv2.rectangle(visualization, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(visualization, str(i), (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)
    cv2.imwrite(output_path, visualization)
    print(f"Visualization saved to {output_path}", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path> [--visualize]", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]

    if len(sys.argv) > 2 and sys.argv[2] == '--visualize':
        try:
            visualize_segmentation(image_path)
        except Exception as viz_e:
            print(f"Error during visualization: {viz_e}", file=sys.stderr)

    try:
        model = load_model()
        if model is None:
             sys.exit(1)

        results = predict_multiple_digits(image_path, model=model)

        if 'error' in results:
            print(f"Prediction Error: {results['error']}", file=sys.stderr)
            sys.exit(1) 
        else:
            print(results['full_number'])

            print(f"\n--- Prediction Details (stderr) ---", file=sys.stderr)
            print(f"Image Path: {image_path}", file=sys.stderr)
            print(f"Predicted Number (stdout): {results['full_number']}", file=sys.stderr)
            print(f"Found {results['digit_count']} digits:", file=sys.stderr)
            for digit_result in results['digits']:
                print(f"  Pos {digit_result['position']}: Digit {digit_result['digit']} (Conf: {digit_result['confidence']:.4f})", file=sys.stderr)
            print(f"--- End Details ---", file=sys.stderr)

    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(1) 