import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Shield, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Envoie l'email et le MDP au serveur
      await login(loginData.email, loginData.password);
      toast.success("Connexion réussie !");
    } catch (err) {
      // Affiche l'erreur précise renvoyée par le backend
      toast.error(err.response?.data?.detail || "Échec de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FFD700] mb-4 gold-glow">
            <Shield className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-[#FFD700] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            RAFY GOLD
          </h1>
          <p className="text-zinc-400 mt-2">Système de Contrôle Interne</p>
        </div>

        <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-2xl text-white">Connexion</CardTitle>
            <CardDescription className="text-zinc-400">
              Utilisez vos accès sécurisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-zinc-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@rafygold.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10 bg-zinc-950 border-zinc-800 focus:border-[#FFD700] focus:ring-[#FFD700]/20 h-12 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-zinc-300">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Saisissez votre mot de passe"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10 bg-zinc-950 border-zinc-800 focus:border-[#FFD700] focus:ring-[#FFD700]/20 h-12 text-white"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-gold h-12 text-base font-bold mt-2"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accéder à l'interface"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-zinc-600 text-sm mt-8">
          Accès restreint au personnel autorisé
          <br />
          ©️ 2026 RAFY GOLD
        </p>
      </div>
    </div>
  );
}