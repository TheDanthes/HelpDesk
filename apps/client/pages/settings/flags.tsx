import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  flagKey: string;
}

const defaultFlags: FeatureFlag[] = [
  {
    name: "Hide Keyboard Shortcuts",
    enabled: false,
    description: "Ocultar los atajos de teclado",
    flagKey: "keyboard_shortcuts_hide", // Added flag key for this feature
  },
  {
    name: "Hide Name in Create",
    enabled: false,
    description: "Ocultar el campo Nombre al crear un ticket",
    flagKey: "name_hide", // Added flag key for this feature
  },
  {
    name: "Hide Email in Create",
    enabled: false,
    description: "Ocultar el campo Correo al crear un ticket",
    flagKey: "email_hide", // Added flag key for this feature
  },
];

export default function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load flags from localStorage on component mount
    const savedFlags = localStorage.getItem("featureFlags");
    if (savedFlags) {
      const parsedFlags = JSON.parse(savedFlags);
      // Merge saved flags with default flags, adding any new flags
      const mergedFlags = defaultFlags.map(defaultFlag => {
        const savedFlag = parsedFlags.find((f: FeatureFlag) => f.name === defaultFlag.name);
        return savedFlag || defaultFlag;
      });
      setFlags(mergedFlags);
      localStorage.setItem("featureFlags", JSON.stringify(mergedFlags));
    } else {
      setFlags(defaultFlags);
      localStorage.setItem("featureFlags", JSON.stringify(defaultFlags));
    }
  }, []);

  const toggleFlag = (flagName: string) => {
    const updatedFlags = flags.map((flag) =>
      flag.name === flagName ? { ...flag, enabled: !flag.enabled } : flag
    );
    setFlags(updatedFlags);
    localStorage.setItem("featureFlags", JSON.stringify(updatedFlags));
    router.reload();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Funciones opcionales</h1>
      <div className="space-y-4">
        {flags.map((flag) => (
          <div
            key={flag.name}
            className="flex flex-row items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <div className="font-bold text-sm">{flag.name}</div>
              <div className="text-xs">{flag.description}</div>
            </div>
            <div>
              <button onClick={() => toggleFlag(flag.name)}>
                {flag.enabled ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
