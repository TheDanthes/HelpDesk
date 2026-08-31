import { toast } from "@/shadcn/hooks/use-toast";
import { Dialog, DialogBackdrop, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { getCookie } from "cookies-next";
import { Fragment, useState } from "react";

export default function ResetPassword({ user }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [check, setCheck] = useState("");

  const postData = async () => {
    if (check === password && password.length > 3) {
      await fetch(`/api/v1/auth/admin/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getCookie("session"),
        },
        body: JSON.stringify({
          password,
          user: user.id,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            toast({
              variant: "default",
              title: "Password Reset Successful",
              description: "The password has been updated successfully.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Uh oh! Something went wrong.",
              description: "There was a problem with your request.",
            });
          }
        });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
    }
  };

  const onCreate = async () => {
    setOpen(false);
    await postData();
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)} type="button" variant="outline">
        Reset Password
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

            {/* This element is to trick the browser into centering the modal contents. */}
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
                      Reset Password
                    </Dialog.Title>
                    <div className="mt-2 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-foreground">
                          New password
                        </Label>
                        <Input
                          type="password"
                          className="bg-background/60"
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter users new password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-foreground">
                          Confirm password
                        </Label>
                        <Input
                          type="password"
                          className="bg-background/60"
                          onChange={(e) => setCheck(e.target.value)}
                          placeholder="Confirm users password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button type="button" onClick={() => onCreate()}>
                    Update
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 sm:mt-0 sm:mr-2"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
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
