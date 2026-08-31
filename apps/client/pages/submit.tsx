// Check if the ID matches the id of the company
// If true then show ticket creation htmlForm else show access denied htmlForm
// API post request to creating a ticket with relevant client info
// Default to unassigned engineer
// Send Email to customer with ticket creation
// Send Email to Engineers with ticket creation if email notifications are turned on

import { toast } from "@/shadcn/hooks/use-toast";
import { Button } from "@/shadcn/ui/button";
import { Card } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Textarea } from "@/shadcn/ui/textarea";
import {
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import { useState } from "react";

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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState("new");
  const [ticketID, setTicketID] = useState("");

  const [selectedType, setSelectedType] = useState(type[2].name);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(pri[0].name);

  async function submitTicket() {
    setIsLoading(true);
    await fetch(`/api/v1/ticket/public/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        title: subject,
        company: router.query.id,
        email,
        detail: description,
        priority,
        type: selectedType,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success === true) {
          toast({
            variant: "default",
            title: "Success",
            description: "Ticket created succesfully",
          });

          setView("success");
          setTicketID(res.id);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Please fill out all information and try again`,
          });
        }
      });
    setIsLoading(false);
  }

  return (
    <div className="flex justify-center items-center content-center min-h-screen bg-background">
      {view === "new" ? (
        <Card className="max-w-2xl w-full border-border/60 bg-card/80 p-10 shadow-lg backdrop-blur">
          <h1 className="font-bold text-2xl text-foreground">Submit a Ticket</h1>
          <span className="text-sm text-muted-foreground">
            Need help? Submit a ticket and our support team will get back to you
            as soon as possible.
          </span>

          <div className="my-6 flex flex-col space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm text-foreground">
                Name
              </Label>
              <div className="mt-2">
                <Input
                  type="text"
                  name="name"
                  id="name"
                  className="bg-background/60"
                  placeholder="John Doe"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-sm text-foreground">
                Email
              </Label>
              <div className="mt-2">
                <Input
                  type="email"
                  name="email"
                  id="email"
                  className="bg-background/60"
                  placeholder="johnD@meta.com"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject" className="text-sm text-foreground">
                Subject
              </Label>
              <div className="mt-2">
                <Input
                  type="text"
                  name="subject"
                  id="subject"
                  className="bg-background/60"
                  placeholder="I can't login to my account"
                  onChange={(e) => setSubject(e.target.value)}
                  value={subject}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Issue Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="mt-2 bg-background/60">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {type.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-2 bg-background/60">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {pri.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comment" className="text-sm text-foreground">
                Description of Issue
              </Label>
              <div className="mt-2">
                <Textarea
                  rows={4}
                  name="comment"
                  id="comment"
                  className="bg-background/60"
                  defaultValue={""}
                  placeholder="I think i locked myself out!"
                  onChange={(e) => setDescription(e.target.value)}
                  value={description}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={submitTicket}
              disabled={isLoading}
              className="self-start"
            >
              Submit Ticket
            </Button>
          </div>
        </Card>
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
                  Ticket Submitted
                </h3>
                <div className="mt-2 text-sm text-white">
                  <p>
                    A member of our team has been notified and will be in touch
                    shortly.
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
