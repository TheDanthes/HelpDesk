import { toast } from "@/shadcn/hooks/use-toast";
import { Dialog, DialogBackdrop, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/shadcn/ui/button";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";

export default function UpdateUserModal({ user }) {
  const [open, setOpen] = useState(false);

  const [admin, setAdmin] = useState(user.isAdmin);

  const router = useRouter();

  async function updateUser() {
    await fetch(`/api/v1/auth/user/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({
        role: admin,
        id: user.id,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success === true) {
          toast({
            variant: "default",
            title: "Success",
            description: "User updated succesfully",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: res.message,
          });
        }
      });
    // .then(() => router.reload());
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)} type="button" variant="outline">
        Role
      </Button>

      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={setOpen}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom rounded-lg bg-card/90 px-4 pt-5 pb-4 text-left shadow-xl backdrop-blur transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </Button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-foreground"
                    >
                      Edit User Role
                    </Dialog.Title>
                    <div className="mt-2 space-y-4">
                      <div className="">
                        <div className="space-y-2 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                          <span className="relative z-0 inline-flex shadow-sm rounded-md space-x-4">
                            <Button
                              onClick={() => setAdmin(false)}
                              type="button"
                              variant={admin ? "outline" : "default"}
                              className="px-4 py-2"
                            >
                              User
                            </Button>
                            <Button
                              onClick={() => setAdmin(true)}
                              type="button"
                              variant={admin ? "default" : "outline"}
                              className="px-4 py-2"
                            >
                              Admin
                            </Button>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button
                    type="button"
                    onClick={async () => {
                      await updateUser();
                    }}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
