import { toast } from "@/shadcn/hooks/use-toast";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState("");
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState();
  const [error, setError]: any = useState();
  const [templates, setTemplates] = useState([]);

  async function deleteEmailConfig() {
    setLoading(true);
    await fetch(`/api/v1/config/email`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then(() => {
        fetchEmailConfig();
      });
  }

  async function fetchTemplates() {
    await fetch("/api/v1/ticket/templates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log(data.templates);
          setTemplates(data.templates);
        }
      });
  }

  async function resetSMTP() {
    await fetch(`/api/v1/config/email`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then(() => {
        fetchEmailConfig();
      });
  }

  async function fetchEmailConfig() {
    await fetch(`/api/v1/config/email`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.active) {
          setEnabled(res.email.active);
          setConfig(res.email);

          if (res.verification !== true) {
            setError(res.verification);
          } else {
            fetchTemplates();
          }
        } else {
          setEnabled(false);
        }
      })
      .then(() => setLoading(false));
  }

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-6">
          <div className="divide-y-2">
            <div className="px-4 sm:px-6 md:px-0 flex flex-row justify-between">
              <h1 className="text-3xl font-extrabold text-foreground">
                Configuración de correo SMTP
              </h1>

              <button className="text-xs" onClick={() => resetSMTP()}>
                Restablecer SMTP
              </button>
            </div>
            <div className="px-4 sm:px-6 md:px-0">
              <div className="sm:flex sm:items-center mt-4">
                <div className="sm:flex-auto">
                  <p className="mt-2 text-sm text-foreground-muted">
                    Administrá la configuración de correo SMTP. Se usa para
                    enviar todos los mensajes salientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!loading ? (
          <div className="px-4 sm:px-6 md:px-0">
            <div className="mb-6">
              {enabled ? (
                <div>
                  {!error ? (
                    <div>
                      <div className="rounded-md bg-green-50 p-4">
                        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <ExclamationTriangleIcon
                                className="h-5 w-5 text-green-400"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">
                                Configuración SMTP encontrada y funcionando
                              </h3>
                              <div className="mt-2 text-sm text-green-700">
                                <p>
                                  La configuración que cargaste funciona
                                  correctamente.
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteEmailConfig()}
                            type="button"
                            className="rounded bg-red-500 text-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-secondary"
                          >
                            Eliminar configuración
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h1>Plantillas de correo</h1>
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Asunto</TableHead>
                              <TableHead>Vista previa</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {templates.map((template) => (
                              <TableRow key={template.id}>
                                <TableCell>{template.type}</TableCell>
                                <TableCell>{template.subject}</TableCell>
                                <TableCell className="max-w-[420px] truncate text-muted-foreground">
                                  {template.html}
                                </TableCell>
                                <TableCell className="text-right">
                                  <a
                                    href={`/admin/smtp/templates/${template.id}`}
                                    className="text-sm font-semibold text-primary hover:underline"
                                  >
                                    Editar
                                  </a>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <ExclamationTriangleIcon
                                className="h-5 w-5 text-red-400"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Error de autenticación
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>
                                  {error?.message ||
                                    "Ocurrió un error desconocido."}
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteEmailConfig()}
                            type="button"
                            className="rounded bg-red-500 text-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-secondary"
                          >
                            Eliminar configuración
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 ml-0.5 flex flex-col">
                        <span className="text-sm font-semibold">
                          Estado de la verificación
                        </span>
                        <span className="text-xs font-semibold">
                          Código: {error && error.code}
                        </span>
                        <span className="text-xs font-semibold">
                          Código: {error && error.response}
                        </span>
                        <span className="text-xs font-semibold">
                          Código: {error && error.responseCode}
                        </span>
                        <span className="text-xs font-semibold">
                          Código: {error && error.command}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-y-4 mt-8 justify-center items-center">
                    {step === 0 && (
                      <Card className="w-[350px]">
                        <CardHeader>
                          <CardTitle>Proveedor de correo</CardTitle>
                          <CardDescription>
                            Algunos proveedores requieren una configuración distinta.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                              <Label htmlFor="framework">Proveedor</Label>
                              <Select
                                onValueChange={(value) => setProvider(value)}
                              >
                                <SelectTrigger id="framework">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  <SelectItem disabled value="microsoft">
                                    Microsoft
                                  </SelectItem>
                                  <SelectItem value="gmail">Google</SelectItem>
                                  <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline">Cancelar</Button>
                          <Button
                            disabled={provider === ""}
                            onClick={() => setStep(1)}
                          >
                            Siguiente
                          </Button>
                        </CardFooter>
                      </Card>
                    )}
                    {step === 1 && provider === "microsoft" && (
                      <MicrosoftSettings />
                    )}
                    {step === 1 && provider === "gmail" && (
                      <GmailSettings setStep={setStep} />
                    )}
                    {step === 1 && provider === "other" && (
                      <SMTP setStep={setStep} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div>Cargando...</div>
        )}
      </div>
    </main>
  );
}

function MicrosoftSettings() {
  return <div>Microsoft</div>;
}

function GmailSettings({ setStep }: { setStep: (step: number) => void }) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(
    `${window.location.origin}/admin/smtp/oauth`
  );
  const [user, setUser] = useState("");

  const router = useRouter();

  async function submitGmailConfig() {
    await fetch(`/api/v1/config/email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({
        host: "smtp.gmail.com",
        port: "465",
        clientId,
        clientSecret,
        username: user,
        reply: user,
        serviceType: "gmail",
        redirectUri: redirectUri,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.authorizeUrl) {
          router.push(res.authorizeUrl);
        }
      });
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Configuración de Gmail</CardTitle>
        <CardDescription>Configurá los datos de OAuth2 de Gmail.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-4">
            <div className="">
              <label
                htmlFor="client_id"
                className="block text-sm font-medium text-foreground"
              >
                ID de cliente
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="client_id"
                  id="client_id"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Tu ID de cliente"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="client_secret"
                className="block text-sm font-medium text-foreground"
              >
                Secreto de cliente
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="client_secret"
                  id="client_secret"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Tu secreto de cliente"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="user_email"
                className="block text-sm font-medium text-foreground"
              >
                Correo del usuario
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="email"
                  name="user_email"
                  id="user_email"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Tu correo electrónico"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="user_email"
                className="block text-sm font-medium text-foreground"
              >
                URI de redirección
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="redirect_uri"
                  id="redirect_uri"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Tu URI de redirección"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button size="sm" variant="outline" onClick={() => setStep(0)}>
          Volver
        </Button>
        <Button
          size="sm"
          disabled={!clientId || !clientSecret || !user}
          onClick={() => submitGmailConfig()}
        >
          Enviar
        </Button>
      </CardFooter>
    </Card>
  );
}

function SMTP({ setStep }: { setStep: (step: number) => void }) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [reply, setReply] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  async function submitConfig() {
    await fetch(`/api/v1/config/email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({
        host,
        active: true,
        port,
        reply,
        username,
        password,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        router.reload();
      });
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Configuración de SMTP</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-4">
            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Servidor SMTP
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="smtp.gmail.com"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Usuario
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="email"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Contraseña
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="password"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Puerto
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="465"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Dirección de respuesta
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="email"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="reply@example.com"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button size="sm" variant="outline" onClick={() => setStep(0)}>
          Volver
        </Button>
        <Button
          size="sm"
          disabled={!host || !port || !username || !password || !reply}
          onClick={() => submitConfig()}
        >
          Enviar
        </Button>
      </CardFooter>
    </Card>
  );
}
