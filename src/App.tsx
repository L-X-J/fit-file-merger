import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to Spark
        </h1>
        <p className="text-muted-foreground">
          Your app is running successfully!
        </p>
        <Button size="lg" className="w-full">
          Get Started
        </Button>
      </Card>
    </div>
  )
}

export default App
