import { getCookie } from "cookies-next";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

import { useUser } from "../store/session";

export default function UserProfile() {
  const { user } = useUser();
  const token = getCookie("session");

  const { t } = useTranslation("peppermint");

  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [language, setLanguage] = useState(user.language);

  function changeLanguage(locale) {
    setLanguage(locale);
    router.push(router.pathname, router.asPath, {
      locale,
    });
  }

  async function updateProfile() {
    await fetch(`/api/v1/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        id: user.id,
        name: name ? name : user.name,
        email: email ? email : user.email,
        language: language ? language : user.language,
      }),
    });
  }

  return (
    <div className="flex justify-center items-center h-[70vh]">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("profile_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-6 flex flex-col lg:flex-row">
            <div className="flex-grow space-y-6">
              <div>
                <Label className="text-sm text-foreground">
                  {t("name")}
                </Label>
                <div className="mt-2">
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="name"
                    className="bg-background/60"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-foreground">
                  {t("email")}
                </Label>
                <div className="mt-2">
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="bg-background/60"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-foreground">
                  {t("language")}
                </Label>
                <Select value={language} onValueChange={changeLanguage}>
                  <SelectTrigger className="mt-2 bg-background/60">
                    <SelectValue placeholder={t("language")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">Inglés</SelectItem>
                    <SelectItem value="de">Alemán</SelectItem>
                    <SelectItem value="se">Sueco</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="no">Noruego</SelectItem>
                    <SelectItem value="fr">Francés</SelectItem>
                    <SelectItem value="tl">Tagalo</SelectItem>
                    <SelectItem value="da">Danés</SelectItem>
                    <SelectItem value="pt">Portugués</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="he">Hebreo</SelectItem>
                    <SelectItem value="tr">Turco</SelectItem>
                    <SelectItem value="hu">Húngaro</SelectItem>
                    <SelectItem value="th">Tailandés (ภาษาไทย)</SelectItem>
                    <SelectItem value="zh-CN">
                      Chino simplificado (简体中文)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-end">
            <Button
              onClick={async () => {
                await updateProfile();
                router.reload();
              }}
              type="submit"
            >
              {t("save_and_reload")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
