import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import Silk from '@/components/ui/Backgrounds/Silk/Silk';
import AnimationOutlinedIcon from '@mui/icons-material/AnimationOutlined';

export default function LoginPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen w-full bg-background">
      <div className="absolute inset-0 z-0">
        <Silk
          speed={4}
          scale={0.8}
          color="#6B6B6B"
          noiseIntensity={10}
          rotation={0}
        />
      </div>
      <Card className="w-full max-w-sm bg-black/50 backdrop-blur-sm border-neutral-700 z-10">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-white">
            <AnimationOutlinedIcon className="text-[#e5ee10] h-8 w-8" />
            NumOSINT
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Connectez-vous pour accéder à la plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex-col items-center gap-2">
           <div className="text-sm text-neutral-400">
              Vous n'avez pas de compte ?{" "}
              <Link href="/register" className="font-bold underline text-[#e5ee10] hover:text-yellow-400">
                Inscrivez-vous
              </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}