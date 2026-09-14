import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Switch } from "@/shadcn/ui/switch";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "../../../../store/session";
import { toast } from "@/shadcn/hooks/use-toast";

export default function CreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [auth, setAuth] = useState(undefined);

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [admin, setAdmin] = useState(false);
  const [language, setLanguage] = useState("es");
  const [externalUser, setExternalUser] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [viewAll, setViewAll] = useState(false);

  const { user } = useUser();

  const router = useRouter();

  useEffect(() => {
    fetch(`/api/v1/clients/all`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getCookie("session"),
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setCompanies(res.clients ?? []);
      })
      .catch(() => setCompanies([]));
  }, []);

  async function createUser() {
    await fetch(`/api/v1/auth/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getCookie("session"),
      },
      body: JSON.stringify({
        password,
        email,
        name,
        admin,
        language,
        external_user: externalUser,
        clients:
          externalUser && companyId ? [{ clientId: companyId, viewAll }] : [],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success === true) {
          router.push("/admin/users/internal");
          toast({
            variant: "default",
            title: "Success",
            description: "User updated succesfully",
          });
        } else {
          toast({
            variant: "destructive",
            title: "There has been an error ",
            description: "Whoops! please wait and try again!",
          });
        }
      });
  }

  async function checkAuth() {
    await fetch(`/api/v1/auth/check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getCookie("session"),
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success === true) {
          setAuth(res.auth);
          setIsLoading(false);
        } else {
        }
      });
  }

  return (
    <div>
      <main className="flex-1">
        <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
          <div className="pt-10 pb-6 divide-y-2">
            <div className="px-4 sm:px-6 md:px-0">
              <h1 className="text-3xl font-extrabold text-foreground">
                Add a new user
              </h1>
            </div>
          </div>
          <div className="">
            <div className="flex flex-col gap-4">
              <div className="w-1/2">
                <Label className="text-foreground font-bold">Name</Label>
                <Input
                  type="text"
                  className="mt-2 bg-background/60"
                  placeholder="John Doe"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="w-1/2">
                <Label className="text-foreground font-bold">Email</Label>
                <Input
                  type="text"
                  className="mt-2 bg-background/60"
                  placeholder="John.Doe@test.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {!user.sso_active && (
                <div className="w-1/2">
                  <Label className="text-foreground font-bold">Password</Label>
                  <Input
                    type="text"
                    className="mt-2 bg-background/60"
                    placeholder=""
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
              <div className="w-1/2 flex flex-col">
                <Label className="text-foreground font-bold">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-2 bg-background/60">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="se">Swedish</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="no">Norwegian</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="pt">Tagalong</SelectItem>
                    <SelectItem value="da">Danish</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="he">Hebrew</SelectItem>
                    <SelectItem value="tr">Turkish</SelectItem>
                    <SelectItem value="hu">Hungarian</SelectItem>
                    <SelectItem value="th">Thai (ภาษาไทย)</SelectItem>
                    <SelectItem value="zh-CN">
                      Simplified Chinese (简体中文)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground font-bold">Admin User</Label>
                <div className="flex flex-row space-x-2 items-center">
                  <Switch
                    checked={admin}
                    onCheckedChange={setAdmin}
                    className="data-[state=checked]:bg-primary"
                  >
                    <span className="sr-only">Enable admin access</span>
                  </Switch>
                </div>
              </div>

              <div>
                <Label className="text-foreground font-bold">
                  Usuario de cliente
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Activalo para alguien de una empresa cliente: solo vera los
                  tickets de las empresas que le asignes. Apagado, es personal de
                  OnDesk y ve todo.
                </p>
                <Switch
                  checked={externalUser}
                  onCheckedChange={(value) => {
                    setExternalUser(value);
                    if (value) setAdmin(false);
                  }}
                  className="data-[state=checked]:bg-primary"
                >
                  <span className="sr-only">Es usuario de cliente</span>
                </Switch>
              </div>

              {externalUser && (
                <>
                  <div className="w-1/2 flex flex-col">
                    <Label className="text-foreground font-bold">Empresa</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger className="mt-2 bg-background/60">
                        <SelectValue placeholder="Elegi una empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                      Podes asignarle mas empresas despues, en Empresas por
                      usuario.
                    </p>
                  </div>

                  <div>
                    <Label className="text-foreground font-bold">
                      Ve todos los tickets de la empresa
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Apagado, solo ve los tickets que abre o que tiene
                      asignados.
                    </p>
                    <Switch
                      checked={viewAll}
                      onCheckedChange={setViewAll}
                      className="data-[state=checked]:bg-primary"
                    >
                      <span className="sr-only">Ve todos los tickets</span>
                    </Switch>
                  </div>
                </>
              )}
              <div
                className="flex justify-end w-full "
                onClick={() => createUser()}
              >
                <Button
                  type="button"
                >
                  Create User
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
