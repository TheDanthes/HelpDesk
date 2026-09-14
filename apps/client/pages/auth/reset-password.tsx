import { toast } from "@/shadcn/hooks/use-toast";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Login({}) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("code");

  async function sendCode() {
    await fetch(`/api/v1/auth/password-reset/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, uuid: router.query.token }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          toast({
            variant: "default",
            title: "Listo",
            description: "Te enviamos un correo para restablecer la contraseña.",
          });
          setView("password");
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Hubo un error con esta solicitud, volvé a intentarlo. Si el problema persiste, comunicate con soporte.",
          });
        }
      });
  }

  async function updatPassword() {
    if (password.length < 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña no puede estar vacía.",
      });
    } else {
      await fetch(`/api/v1/auth/password-reset/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            toast({
              variant: "default",
              title: "Listo",
              description: "La contraseña se actualizó correctamente.",
            });
            router.push("/auth/login");
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "Hubo un error con esta solicitud, volvé a intentarlo. Si el problema persiste, comunicate con soporte.",
            });
          }
        });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Restablecer contraseña
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-border/60 bg-card/80 shadow-lg backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-xl text-foreground">
              Verificá tu código
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ingresá el código que enviamos a tu correo.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {view === "code" ? (
              <>
                <div>
                  <Label htmlFor="code" className="text-sm text-foreground">
                    Código
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="code"
                      name="code"
                      type="text"
                      autoComplete="off"
                      required
                      onChange={(e) => setCode(e.target.value)}
                      className="bg-background/60"
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    onClick={sendCode}
                    className="w-full"
                  >
                    Verificar código
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="password" className="text-sm text-foreground">
                    Nueva contraseña
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="off"
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/60"
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    onClick={updatPassword}
                    className="w-full"
                  >
                    Cambiar contraseña
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
