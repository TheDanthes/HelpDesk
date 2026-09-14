// Check if the ID matches the id of the company
// If true then show ticket creation htmlForm else show access denied htmlForm
// API post request to creating a ticket with relevant client info
// Default to unassigned engineer
// Send Email to customer with ticket creation
// Send Email to Engineers with ticket creation if email notifications are turned on

import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { etiquetaPrioridad, etiquetaTipo } from "@/shadcn/lib/labels";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "../../store/session";
import { toast } from "@/shadcn/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

const type = [
  { id: 5, name: "Incident" },
  { id: 1, name: "Service" },
  { id: 2, name: "Feature" },
  { id: 3, name: "Bug" },
  { id: 4, name: "Maintenance" },
  { id: 6, name: "Access" },
  { id: 8, name: "Feedback" },
];

const pri = [
  { id: 7, name: "Low" },
  { id: 8, name: "Medium" },
  { id: 9, name: "High" },
];

export default function ClientTicketNew() {
  const { user } = useUser();

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState("new");
  const [ticketID, setTicketID] = useState("");

  const [selectedType, setSelectedType] = useState(type[2]?.name ?? "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(pri[0]?.name ?? "");
  const [company, setCompany] = useState("");

  const companies: { id: string; name: string }[] = user?.clients ?? [];

  // Con una sola empresa no hay nada que preguntar: la elegimos nosotros.
  useEffect(() => {
    if (companies.length === 1) {
      setCompany(companies[0].id);
    }
  }, [companies]);

  async function submitTicket() {
    setIsLoading(true);
    await fetch(`/api/v1/ticket/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({
        name: user.name,
        title: subject,
        email: user.email,
        detail: description,
        priority,
        type: selectedType,
        company: company || undefined,
        createdBy: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          toast({
            variant: "default",
            title: "Ticket creado",
            description: "El ticket se creó correctamente",
          });
          setView("success");
          setTicketID(res.id);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Completá todos los datos y volvé a intentarlo",
          });
        }
      });
    setIsLoading(false);
  }

  return (
    <div className="flex justify-center items-center content-center h-screen bg-gray-100">
      {view === "new" ? (
        <div className="max-w-4xl min-w-[400px] sm:min-w-[600px] shadow-xl bg-white p-12 rounded-md">
          <h1 className="font-bold text-2xl">Crear un ticket</h1>

          <div className="my-4 flex flex-col space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Asunto
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                  placeholder="No puedo iniciar sesión en mi cuenta"
                  onChange={(e) => setSubject(e.target.value)}
                  value={subject}
                />
              </div>
            </div>

            {companies.length > 1 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Empresa
                </label>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Elegí la empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Tipo de solicitud
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Elegí el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {type.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {etiquetaTipo(item.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Prioridad
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Elegí la prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {pri.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {etiquetaPrioridad(item.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Descripción del problema
              </label>
              <div className="mt-2">
                <textarea
                  rows={4}
                  name="comment"
                  id="comment"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  defaultValue={""}
                  placeholder="Creo que me quedé afuera de mi cuenta"
                  onChange={(e) => setDescription(e.target.value)}
                  value={description}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={submitTicket}
              disabled={isLoading || (companies.length > 1 && !company)}
              className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
            >
              Crear ticket
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md bg-green-600 shadow-md p-12">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon
                  className="h-10 w-10 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-4xl font-medium text-white">
                  Ticket enviado
                </h3>
                <div className="mt-2 text-sm text-white">
                  <p>
                    Ya notificamos a nuestro equipo y en breve se van a
                    comunicar con vos.
                  </p>
                </div>
                {/* <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Link
                      href={`/portal/${router.query.id}/ticket/${ticketID}`}
                      className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                    >
                      View status
                    </Link>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
