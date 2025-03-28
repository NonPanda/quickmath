
import DarkModeToggle from "../components/DarkModeToggle"
export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-screen relative bg-background">
        
        <DarkModeToggle/>
        <h1 className="text-6xl">Welcome to QuickMath</h1>
        <p className="text-xl mt-4">The best place to learn math!</p>
        </div>
    )
    }