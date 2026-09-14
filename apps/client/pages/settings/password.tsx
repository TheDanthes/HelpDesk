import { useState } from "react";

import { getCookie } from "cookies-next";
import { toast } from "@/shadcn/hooks/use-toast";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";

export default function PasswordChange({ children }) {
  const token = getCookie("session");

  const [password, setPassword] = useState("");
  const [check, setCheck] = useState("");

  const postData = async () => {
    if (check === password && password.length > 2) {
      await fetch(`/api/v1/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          password,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            toast({
              variant: "default",
              title: "Listo",
              description: "La contraseña se actualizó correctamente.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Error: no se pudo actualizar la contraseña",
            });
          }
        });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error: las contraseñas no coinciden",
      });
    }
  };

  return (
    <>
      <main className="py-2">
        <div className="mt-4">
          <div className="m-2 space-y-4 p-4">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                Nueva contraseña
              </Label>
              <Input
                type="password"
                className="bg-background/60"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá la nueva contraseña del usuario"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                Confirmar contraseña
              </Label>
              <Input
                type="password"
                className="bg-background/60"
                onChange={(e) => setCheck(e.target.value)}
                placeholder="Confirmá la contraseña del usuario"
              />
            </div>
          </div>
        </div>
        <div className="pb-2 px-4 flex justify-end sm:px-6">
          <Button
            onClick={async () => {
              await postData();
            }}
            type="submit"
          >
            Actualizar contraseña
          </Button>
        </div>
      </main>
    </>
  );
}
