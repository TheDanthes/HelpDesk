import { toast } from "@/shadcn/hooks/use-toast";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Login({}) {
  const router = useRouter();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("idle");

  async function postData() {
    if (password === passwordConfirm && validateEmail(email)) {
      setStatus("loading");

      const response = await fetch("/api/v1/auth/user/register/external", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          passwordConfirm,
          language,
        }),
      }).then((res) => res.json());

      if (response.success) {
        setStatus("idle");
        router.push("/auth/login");
      } else {
        setStatus("idle");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Las contraseñas no coinciden o el correo electrónico no es válido",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Creá tu cuenta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {status === "loading" ? (
          <div className="text-center mr-4">{/* <Loader size={32} /> */}</div>
        ) : (
          <Card className="border-border/60 bg-card/80 shadow-lg backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-xl text-foreground">
                Registrate en OnDesk
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Registro de usuarios externos.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm text-foreground">
                  Correo electrónico
                </Label>
                <div className="mt-2">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-foreground">
                  Contraseña
                </Label>
                <div className="mt-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    className="bg-background/60"
                  />
                </div>
                <Label htmlFor="passwordConfirm" className="text-sm text-foreground">
                  Confirmar contraseña
                </Label>
                <div className="mt-2">
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    autoComplete="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="bg-background/60"
                  />
                </div>

                <Label className="text-sm text-foreground">Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-2 bg-background/60">
                    <SelectValue placeholder="Elegí un idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">Inglés</SelectItem>
                    <SelectItem value="de">Alemán</SelectItem>
                    <SelectItem value="se">Sueco</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="no">Noruego</SelectItem>
                    <SelectItem value="fr">Francés</SelectItem>
                    <SelectItem value="pt">Tagalo</SelectItem>
                    <SelectItem value="da">Danés</SelectItem>
                    <SelectItem value="pt">Portugués</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="he">Hebreo</SelectItem>
                    <SelectItem value="tr">Turco</SelectItem>
                    <SelectItem value="hu">Húngaro</SelectItem>
                    <SelectItem value="th">Tailandés (ภาษาไทย)</SelectItem>
                    <SelectItem value="zh-CN">
                      Chino simplificado (简体中文)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  type="submit"
                  onClick={postData}
                  className="w-full"
                >
                  Crear cuenta
                </Button>

                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Este formulario es solo para usuarios externos
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center flex flex-col space-y-2">
          <span className="font-bold text-foreground">
            Hecho con 💚 por OnDesk
          </span>
          <a
            href={process.env.DOCS_URL ?? "https://docs.pepperminto.dev"}
            target="_blank"
            className="text-foreground"
          >
            Documentación
          </a>
        </div>
      </div>
    </div>
  );
}
