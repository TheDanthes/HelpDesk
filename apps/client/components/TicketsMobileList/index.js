import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/shadcn/ui/input";

export default function TicketsMobileList({ tickets }) {
  const high = "bg-red-100 text-red-800";
  const low = "bg-blue-100 text-blue-800";
  const normal = "bg-green-100 text-green-800";

  const [data, setData] = React.useState(tickets);
  const [searchParam] = useState(["title", "name", "priority"]);
  const [f, setF] = useState("");

  async function filter(e) {
    setF(e.target.value);
    const filter = tickets.filter((item) => {
      return searchParam.some((newItem) => {
        return (
          item[newItem].toString().toLowerCase().indexOf(f.toLowerCase()) > -1
        );
      });
    });

    setData(filter);
  }

  return (
    <div className="overflow-x-auto md:-mx-6 lg:-mx-8 mt-10">
      <div>
        <Input
          type="text"
          name="text"
          id="text"
          className="bg-background/60"
          placeholder="Search ...."
          value={f}
          onChange={(e) => filter(e)}
        />
      </div>

      <div className="py-2 align-middle inline-block min-w-full md:px-6 lg:px-8">
        <div className="overflow-hidden md:rounded-lg">
          {data.map((ticket) => {
            let p = ticket.priority;
            let badge;

            if (p === "Low") {
              badge = low;
            }
            if (p === "Normal") {
              badge = normal;
            }
            if (p === "High") {
              badge = high;
            }

            return (
              <div className="flex justify-start" key={ticket.id}>
                <div className="w-full mb-2 rounded-lg border border-border/60 bg-card/70">
                  <div className="px-4 py-4">
                    <div>
                      <h1 className="font-semibold leading-tight text-2xl text-foreground ml-1">
                        {ticket.title}
                      </h1>
                      <p className="px-2 text-muted-foreground">
                        Client: {ticket.client ? ticket.client.name : "n/a"}
                      </p>
                      <p className="px-2 text-muted-foreground">
                        Name of caller: {ticket.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}
                    >
                      {ticket.priority}
                    </span>
                    <p className="text-foreground m-2">{ticket.issue}</p>
                    <div className="text-muted-foreground text-sm font-bold mt-2">
                      <Link href={`/issue/${ticket.id}`} className="">
                        View Full Ticket
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
