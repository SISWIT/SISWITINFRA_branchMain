import { useState } from "react";
import { ArrowUpRight, Linkedin, Mail } from "lucide-react";
import { leadershipData, type LeadershipMember } from "@/data/leadershipData";
import { cn } from "@/core/utils/utils";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

function LeadershipAvatar({
  member,
  sizeClass,
}: {
  member: LeadershipMember;
  sizeClass: string;
}) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(member.imageUrl) && !imageError;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-muted/35 shadow-inner",
        sizeClass
      )}
    >
      {hasImage ? (
        <img
          src={member.imageUrl}
          alt={`Portrait of ${member.name}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: member.imagePosition ?? "center center" }}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-background">
          <span className="text-4xl font-semibold tracking-wide text-primary/85">{getInitials(member.name)}</span>
        </div>
      )}
    </div>
  );
}

function ContactActions({ member }: { member: LeadershipMember }) {
  const hasLinkedIn = Boolean(member.linkedIn);
  const hasEmail = Boolean(member.email);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasLinkedIn && (
        <a
          href={member.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          aria-label={`${member.name} LinkedIn`}
        >
          <Linkedin className="h-3.5 w-3.5" />
          LinkedIn
        </a>
      )}
      {hasEmail && (
        <a
          href={`mailto:${member.email}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          aria-label={`Email ${member.name}`}
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </a>
      )}
      {!hasLinkedIn && !hasEmail && (
        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {member.contactNote ?? "Contact Undisclosed"}
        </span>
      )}
    </div>
  );
}

function FeaturedCard({ member }: { member: LeadershipMember }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-primary/25 bg-card/85 p-5 shadow-card lg:p-7">
      <div className="pointer-events-none absolute -top-28 right-[-5rem] h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[-4rem] h-60 w-60 rounded-full bg-info/10 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-[15rem_1fr] lg:items-center">
        <LeadershipAvatar member={member} sizeClass="h-56 w-full lg:h-64" />

        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Featured Leader
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">{member.name}</h3>
            <p className="mt-1 text-sm font-medium text-primary sm:text-base">{member.role}</p>
          </div>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">{member.description}</p>
          <ContactActions member={member} />
        </div>
      </div>
    </article>
  );
}

function TeamCard({ member, index }: { member: LeadershipMember; index: number }) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-card-hover",
        "animate-in fade-in-0 slide-in-from-bottom-6 duration-700"
      )}
      style={{ animationDelay: `${index * 70}ms` }}
      aria-label={`${member.name}, ${member.role}`}
    >
      <LeadershipAvatar member={member} sizeClass="mb-4 h-44 w-full" />

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
        <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
      </div>

      <p className="mb-4 min-h-[2.75rem] text-sm text-muted-foreground line-clamp-2">{member.description}</p>

      <div className="mt-auto">
        <ContactActions member={member} />
      </div>
    </article>
  );
}

export function LeadershipSection() {
  const [featured, ...members] = leadershipData;

  return (
    <section className="relative overflow-hidden py-20 lg:py-28" aria-labelledby="leadership-heading">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-36 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute top-[34%] right-[-7rem] h-72 w-72 rounded-full bg-info/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Our Team
          </span>
          <h2 id="leadership-heading" className="mt-5 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Leadership Team
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            SISWIT leadership spanning product, finance, operations, marketing, and engineering.
          </p>
        </div>

        {featured && (
          <div className="mt-12">
            <FeaturedCard member={featured} />
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {members.map((member, index) => (
            <TeamCard key={member.id} member={member} index={index} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
          >
            Connect With Our Team
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
