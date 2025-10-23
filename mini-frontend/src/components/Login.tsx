import { Shield, Lock } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'

interface LoginProps {
  onLogin: () => void
}

export function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">
              Clinical Voice Assistant
            </CardTitle>
            <CardDescription className="text-base mt-2">
              AI-Powered Medical Transcription
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Please sign in with your eCW/Healow account to continue
            </p>
          </div>

          <Button
            onClick={onLogin}
            size="lg"
            className="w-full text-lg h-14"
          >
            <Lock className="w-5 h-5 mr-2" />
            Login with eCW
          </Button>

          <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>You'll be redirected to the official Healow/eCW sign-in page</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>We do not collect or store your credentials</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Secure OAuth 2.0 + PKCE authentication</span>
            </p>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>By continuing, you agree to access clinical data through</p>
            <p className="font-medium">eClinicalWorks FHIR API</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

