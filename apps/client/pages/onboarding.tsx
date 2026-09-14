import { useRouter } from "next/router";

import { getCookie } from "cookies-next";
import Link from "next/link";
import { useUser } from "../store/session";

export default function Home() {
  const router = useRouter();

  const { user } = useUser();

  async function updateFirstLogin() {
    await fetch(`/api/v1/auth/user/${user.id}/first-login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          router.push("/");
        }
      });
  }

  return (
    <div className="bg-background">
      <div className="flex justify-center align-center h-screen items-center">
        <div className="bg-background shadow-xl rounded-lg lg:p-8 p-4 mx-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-2xl text-foreground font-bold">
                OnDesk{" "}
              </h1>
              <p className="text-foreground">
                ¡Bienvenido a OnDesk! Un sistema de gestión de tickets
                totalmente de código abierto.
              </p>
            </div>
          </div>
          <div className="mt-4 ">
            <div className="flex flex-col space-y-4">
              <div className="border p-2 md:p-6 rounded-md border-dashed flex flex-col md:flex-row space-x-4 items-center">
                <img src="/github.svg" className="h-10 w-10" />
                <div className="flex flex-col align-center lg:w-[36em]">
                  <span className="font-bold text-lg">Github</span>
                  <span className="max-w-lg  text-xs md:text-md">
                    Al ser un proyecto de código abierto, todo nuestro código
                    vive acá. Entrá si encontrás un error o si tenés alguna
                    duda.
                  </span>
                </div>
                <Link
                  target="_blank"
                  href="https://github.com/nulldoubt/Pepperminto"
                  className="rounded-md mt-4 sm:mt-0 bg-gray-600 px-2.5 whitespace-nowrap hover:text-white py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 "
                >
                  Ver más
                </Link>
              </div>
              <div className="border p-2 md:p-6 rounded-md border-dashed w-full flex flex-col md:flex-row space-x-4 items-center">
                <img src="/logo.svg" className="h-10 w-10" />
                <div className="flex flex-col align-center lg:w-[36em]">
                  <span className="font-bold text-lg">Documentación</span>
                  <span className="max-w-lg text-xs md:text-md">
                    Acá vas a encontrar la documentación de OnDesk. Si ves algo
                    que no está documentado, abrí un PR o un issue y lo
                    resolvemos enseguida.
                  </span>
                </div>
                <Link
                  target="_blank"
                  href="https://github.com/nulldoubt/Pepperminto"
                  className="rounded-md flex-end bg-green-600 mt-4 whitespace-nowrap sm:mt-0 px-2.5 py-1.5 text-sm font-semibold hover:text-white text-white shadow-sm hover:bg-green-500 "
                >
                  Ver más
                </Link>
              </div>
              <div className="border p-2 md:p-6 rounded-md border-dashed flex flex-col md:flex-row space-x-4 items-center ">
                <img src="/discord.svg" className="h-10 w-10" />
                <div className="flex flex-col align-center lg:w-[36em]">
                  <span className="font-bold text-lg">Discord</span>
                  <span className="max-w-lg text-xs md:text-md">
                    Sumate a nuestro servidor de Discord para recibir ayuda de
                    la comunidad o del equipo de desarrollo.
                  </span>
                </div>
                <Link
                  target="_blank"
                  href="https://discord.gg/zbTy8nuHnK"
                  className="rounded-md bg-blue-600 mt-4 whitespace-nowrap sm:mt-0 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 "
                >
                  Ver más
                </Link>
              </div>
            </div>
          </div>
          <div className="float-right mt-4">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 mr-6 text-sm font-semibold rounded-lg"
              onClick={() => updateFirstLogin()}
            >
              Ir al panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
