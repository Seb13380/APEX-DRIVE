"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/", label: "Accueil", icon: "⌂" },
  { href: "/clients", label: "Mes clients", icon: "◔" },
  { href: "/todo", label: "To-do list", icon: "✓" },
  { href: "/calendrier", label: "Calendrier", icon: "▤" },
  { href: "/statistiques", label: "Statistiques", icon: "▲" },
  { href: "/assistant", label: "Assistant IA", icon: "●" },
  { href: "/parametres", label: "Paramètres", icon: "⚙" },
];

export function Sidebar({
  nomConcession,
  logoUrl,
  email,
  nomCommercial,
}: {
  nomConcession: string;
  logoUrl: string | null;
  email: string;
  nomCommercial: string;
}) {
  const pathname = usePathname();
  const nomAffiche = nomCommercial || email;
  const initiale = nomAffiche.charAt(0).toUpperCase();

  return (
    <aside>
      <div className="logo-slot">
        <div className="logo-box">
          <img src={logoUrl || encodeURI("/img/Logo carré CarAutoPilote.png")} alt="Logo concession" />
        </div>
        <div className="logo-text">
          <div className="name">{nomConcession || "Nom concession"}</div>
          <div className="edit">modifiable</div>
        </div>
      </div>
      <nav>
        {LIENS.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className={pathname === lien.href ? "active" : undefined}
          >
            <span className="ic">{lien.icon}</span>
            {lien.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">{initiale}</div>
        <div>
          <div className="who">{nomAffiche}</div>
          <div className="role">Conseiller commercial</div>
        </div>
      </div>
    </aside>
  );
}
