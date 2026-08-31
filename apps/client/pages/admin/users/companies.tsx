import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Switch } from "@/shadcn/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { useMemo, useState } from "react";

type Company = { id: string; name: string };
type Membership = { clientId: string; name: string; viewAll: boolean };
type User = {
  id: string;
  name: string;
  email: string;
  external_user: boolean;
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getCookie("session")}`,
  };
}

/**
 * Empresas por usuario.
 *
 * Un usuario de cliente solo ve tickets de las empresas listadas aca. El switch
 * "Ve todos" es por empresa: activado, ve todos los tickets de esa empresa;
 * apagado, solo los que abrio o tiene asignados.
 */
export default function UserCompanies() {
  const [selected, setSelected] = useState<string | null>(null);
  const [toAdd, setToAdd] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const users = useQuery({
    queryKey: ["usersWithClients"],
    queryFn: () =>
      fetch("/api/v1/users/all?includeExternal=true", {
        headers: authHeaders(),
      }).then((r) => r.json()),
  });

  const companies = useQuery({
    queryKey: ["allClients"],
    queryFn: () =>
      fetch("/api/v1/clients/all", { headers: authHeaders() }).then((r) =>
        r.json()
      ),
  });

  const memberships = useQuery({
    queryKey: ["memberships", selected],
    enabled: Boolean(selected),
    queryFn: () =>
      fetch(`/api/v1/user/${selected}/clients`, {
        headers: authHeaders(),
      }).then((r) => r.json()),
  });

  const userList: User[] = users.data?.users ?? [];
  const companyList: Company[] = companies.data?.clients ?? [];
  const current: Membership[] = memberships.data?.clients ?? [];

  const selectedUser = userList.find((u) => u.id === selected) ?? null;

  const assignable = useMemo(
    () => companyList.filter((c) => !current.some((m) => m.clientId === c.id)),
    [companyList, current]
  );

  async function assign() {
    if (!selected || !toAdd) return;

    setSaving(true);
    await fetch(`/api/v1/user/${selected}/clients`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ clientId: toAdd, viewAll: false }),
    });
    setToAdd("");
    await memberships.refetch();
    await users.refetch();
    setSaving(false);
  }

  async function toggleViewAll(clientId: string, viewAll: boolean) {
    if (!selected) return;

    setSaving(true);
    await fetch(`/api/v1/user/${selected}/clients/${clientId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ viewAll }),
    });
    await memberships.refetch();
    setSaving(false);
  }

  async function remove(clientId: string) {
    if (!selected) return;

    setSaving(true);
    await fetch(`/api/v1/user/${selected}/clients/${clientId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await memberships.refetch();
    await users.refetch();
    setSaving(false);
  }

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16 divide-y-2">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-foreground">
              Empresas por usuario
            </h1>
          </div>

          <div className="px-4 sm:px-6 md:px-0 space-y-6">
            <p className="mt-4 text-sm text-muted-foreground">
              Un usuario de cliente solo ve los tickets de las empresas que
              tenga asignadas. Con <strong>Ve todos</strong> apagado, dentro de
              esa empresa ve unicamente los tickets que abrio o que tiene
              asignados.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Usuario
              </label>
              <Select
                value={selected ?? ""}
                onValueChange={(value) => setSelected(value)}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Elegi un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {userList.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} — {user.email}
                      {user.external_user ? " (cliente)" : " (OnDesk)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && !selectedUser.external_user && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
                <strong>{selectedUser.name}</strong> es personal de OnDesk: ya ve
                los tickets de todas las empresas, asi que asignarle membresias
                no cambia nada. Las membresias son para usuarios de cliente.
              </div>
            )}

            {selected && (
              <>
                <div className="rounded-lg border border-border/60 bg-card/80 shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="px-6 py-3">Empresa</TableHead>
                        <TableHead className="px-6 py-3">Ve todos</TableHead>
                        <TableHead className="px-6 py-3" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {current.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="px-6 py-6 text-sm text-muted-foreground"
                          >
                            Sin empresas asignadas. Este usuario no ve ningun
                            ticket.
                          </TableCell>
                        </TableRow>
                      )}
                      {current.map((m) => (
                        <TableRow key={m.clientId}>
                          <TableCell className="px-6 py-4 text-sm font-medium">
                            {m.name}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Switch
                              checked={m.viewAll}
                              disabled={saving}
                              onCheckedChange={(value) =>
                                toggleViewAll(m.clientId, value)
                              }
                            />
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={saving}
                              onClick={() => remove(m.clientId)}
                            >
                              Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-end gap-3">
                  <div className="space-y-2 flex-1 max-w-md">
                    <label className="text-sm font-medium text-foreground">
                      Agregar empresa
                    </label>
                    <Select value={toAdd} onValueChange={setToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegi una empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignable.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    disabled={!toAdd || saving}
                    onClick={assign}
                  >
                    Agregar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
