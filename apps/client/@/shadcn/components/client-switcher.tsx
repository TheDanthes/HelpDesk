import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { useUser } from "../../../store/session";

/** Debe coincidir con ACTIVE_CLIENT_COOKIE en apps/api/src/lib/tenant.ts */
const ACTIVE_CLIENT_COOKIE = "ondesk_client";

type Company = { id: string; name: string; viewAll?: boolean };

/**
 * Selector de empresa activa.
 *
 * Guarda la eleccion en una cookie que el proxy de Next reenvia a la API, asi
 * todas las consultas de tickets quedan acotadas sin tocar cada fetch.
 * Recarga la pagina al cambiar para que los datos ya cargados se re-pidan.
 *
 * No se muestra cuando el usuario tiene una sola empresa y no puede elegir.
 */
export function ClientSwitcher() {
  const { user } = useUser();
  const [active, setActive] = useState<string | null>(null);
  const [staffCompanies, setStaffCompanies] = useState<Company[]>([]);

  const isStaff = user ? !user.external_user : false;
  const companies: Company[] = isStaff ? staffCompanies : user?.clients ?? [];

  useEffect(() => {
    const stored = getCookie(ACTIVE_CLIENT_COOKIE);
    setActive(typeof stored === "string" && stored ? stored : null);
  }, []);

  // El personal de OnDesk no tiene membresias: su lista de empresas es el
  // padron completo de clientes.
  useEffect(() => {
    if (!isStaff) return;

    fetch("/api/v1/clients/all", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.clients)) {
          setStaffCompanies(
            res.clients.map((c: any) => ({ id: c.id, name: c.name }))
          );
        }
      })
      .catch(() => setStaffCompanies([]));
  }, [isStaff]);

  // Si la empresa guardada ya no esta asignada al usuario, limpiamos la cookie
  // para no dejarlo con una vista vacia y un 403 de la API.
  useEffect(() => {
    if (!active || isStaff || companies.length === 0) return;

    if (!companies.some((c) => c.id === active)) {
      deleteCookie(ACTIVE_CLIENT_COOKIE);
      setActive(null);
    }
  }, [active, companies, isStaff]);

  function select(id: string | null) {
    if (id) {
      setCookie(ACTIVE_CLIENT_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    } else {
      deleteCookie(ACTIVE_CLIENT_COOKIE, { path: "/" });
    }

    setActive(id);
    window.location.reload();
  }

  // Staff sin empresas cargadas, o cliente con una sola: no hay nada que elegir.
  if (!user) return null;
  if (!isStaff && companies.length <= 1) return null;
  if (isStaff && companies.length === 0) return null;

  const current = companies.find((c) => c.id === active);
  const label = current ? current.name : "Todas las empresas";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border/60 px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"
        >
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {label}
          </span>
          <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => select(null)}>
          <span className="flex-1">Todas las empresas</span>
          {!active && <Check className="size-4" />}
        </DropdownMenuItem>
        {companies.map((company) => (
          <DropdownMenuItem key={company.id} onClick={() => select(company.id)}>
            <span className="flex-1 truncate">{company.name}</span>
            {active === company.id && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
