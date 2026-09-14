import { toast } from "@/shadcn/hooks/use-toast";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { setCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Login({}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [auth, setAuth] = useState("oauth");
  const [url, setUrl] = useState("");

  async function postData() {
    try {
      await fetch(`/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
        .then((res) => res.json())
        .then(async (res) => {
          if (res.user) {
            setCookie("session", res.token);
            if (res.user.external_user) {
              router.push("/portal");
            } else {
              if (res.user.firstLogin) {
                router.push("/onboarding");
              } else {
                router.push("/");
              }
            }
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "Hubo un error al iniciar sesión, volvé a intentarlo. Si el problema persiste, comunicate con soporte.",
            });
          }
        });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error de base de datos",
        description:
          "Se produjo un problema con la base de datos. Revisá los registros o comunicate con soporte.",
      });
    }
  }

  async function oidcLogin() {
    await fetch(`/api/v1/auth/check`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.url) {
          setUrl(res.url);
        }
      });
  }

  useEffect(() => {
    oidcLogin();
  }, []);

  useEffect(() => {
    if (router.query.error) {
      toast({
        variant: "destructive",
        title: "Error de cuenta - No se encontró la cuenta",
        description:
          "Parece que intentaste ingresar con SSO usando una cuenta que no existe. Volvé a intentarlo o pedile a tu administrador que te dé de alta.",
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Bienvenido a OnDesk
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {status === "loading" ? (
          <div className="text-center mr-4">{/* <Loader size={32} /> */}</div>
        ) : (
          <Card className="border-border/60 bg-card/80 shadow-lg backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-xl text-foreground">
                Iniciá sesión en tu espacio de trabajo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Usá tu cuenta de OnDesk para continuar.
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
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        postData();
                      }
                    }}
                  />
                </div>
              </div>

              <div>
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
                    className="bg-background/60"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        postData();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  onClick={postData}
                  className="w-full"
                >
                  Iniciar sesión
                </Button>

                {url && (
                  <Button
                    type="submit"
                    onClick={() => router.push(url)}
                    variant="outline"
                    className="w-full"
                  >
                    Iniciar sesión con OIDC
                  </Button>
                )}
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
