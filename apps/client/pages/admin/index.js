export default function BlankPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
            <img className="h-6 w-6" src="/logo.svg" alt="logo" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Consola de administración
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Bienvenido a OnDesk
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Administrá equipos, tickets y configuración para que la mesa de
              ayuda funcione sin sobresaltos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Administrar la base de conocimiento",
            detail: "Publicá artículos de ayuda y mantené informados a los clientes.",
          },
          {
            title: "Auditar la actividad",
            detail: "Revisá los registros y los eventos de seguridad en un solo lugar.",
          },
          {
            title: "Actualizar la configuración",
            detail: "Ajustá el correo, la autenticación y las integraciones por webhook.",
          },
          {
            title: "Invitar a tu equipo",
            detail: "Sumá agentes, asigná roles y organizá los flujos de trabajo.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
