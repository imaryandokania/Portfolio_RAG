import { ImageResponse } from "next/og";
import { resumeData } from "../data/resumeData";
import { computeExperienceMetrics } from "../utils/resumeMetrics";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function getHeroEducation(): string | null {
  const primaryEducation = resumeData.sections.education?.[0];
  if (!primaryEducation) return null;
  const { degree = "", university = "" } = primaryEducation;

  let compactDegree = degree;
  if (/master of science/i.test(degree) && /computer science/i.test(degree)) {
    compactDegree = "MS CS";
  } else if (/master of science/i.test(degree)) {
    compactDegree = "MS";
  }

  let compactUniversity = university;
  if (/university of california san diego/i.test(university)) {
    compactUniversity = "UC San Diego";
  }

  return `${compactDegree} @ ${compactUniversity}`.trim();
}

const metrics = computeExperienceMetrics();

const telemetry = [
  {
    label: "AI Systems Index",
    value: `${metrics.aiScore}/100`,
    detail: `${metrics.mlMentions} signals · ${metrics.researchCount} papers`,
  },
  {
    label: "Cloud Coverage",
    value: `${metrics.cloudScore}/100`,
    detail: `${metrics.cloudToolCount} tools · ${metrics.cloudMentions} mentions`,
  },
  {
    label: "Project Velocity",
    value: `${metrics.projectScore}/100`,
    detail: `${metrics.projectPoints} key highlights`,
  },
];

const contact = [
  { label: "Location", value: resumeData.contact.location },
  { label: "Email", value: resumeData.contact.email },
  { label: "Scholar", value: resumeData.contact.scholar?.replace(/^https?:\/\//, "") ?? "" },
];

export default function OgImage() {
  const heroEducation = getHeroEducation();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px",
          background:
            "radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(99,102,241,0.16), #05010a)",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "1000px",
            height: "520px",
            borderRadius: "36px",
            border: "1px solid rgba(56,189,248,0.35)",
            background:
              "linear-gradient(145deg, rgba(4,8,20,0.88), rgba(8,12,30,0.92))",
            backdropFilter: "blur(20px)",
            boxShadow: "0 32px 90px rgba(56,189,248,0.18)",
            display: "flex",
            gap: "32px",
            padding: "42px 48px",
          }}
        >
          <div style={{ flex: 1.4, display: "flex", flexDirection: "column", gap: "28px" }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                color: "rgba(56,189,248,0.75)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "fit-content",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  background: "#38bdf8",
                  boxShadow: "0 0 16px rgba(56,189,248,0.8)",
                }}
              />
              Portfolio · Live
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h1 style={{ fontSize: 80, lineHeight: 0.95, fontWeight: 700 }}>
                {resumeData.name}
              </h1>
              {heroEducation && (
                <p
                  style={{
                    fontSize: 24,
                    color: "#38bdf8",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {heroEducation}
                </p>
              )}
              <p
                style={{
                  fontSize: 24,
                  color: "rgba(255,255,255,0.72)",
                  maxWidth: "560px",
                  lineHeight: 1.35,
                }}
              >
                Cloud-native engineer crafting resilient systems, applied ML tools, and AI-assisted developer experiences.
              </p>
            </div>
            <div
              style={{
                marginTop: "10px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px 16px",
              }}
            >
              {contact
                .filter((entry) => entry.value)
                .map((entry) => (
                  <div
                    key={entry.label}
                    style={{
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    padding: "12px 16px",
                    background: "rgba(56,189,248,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.35em",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {entry.label}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>
                    {entry.value}
                  </span>
                  </div>
                ))}
            </div>
          </div>

          <div
            style={{
              flex: 0.9,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div
              style={{
                borderRadius: "28px",
                border: "1px solid rgba(99,102,241,0.35)",
                background: "linear-gradient(150deg, rgba(10,12,30,0.9), rgba(15,18,38,0.95))",
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Neural Query Console
              </span>
              <div
                style={{
                  height: "54px",
                  borderRadius: "18px",
                  border: "1px solid rgba(56,189,248,0.35)",
                  background: "rgba(5,10,25,0.9)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 18px",
                  fontSize: 20,
                  color: "rgba(255,255,255,0.8)",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "30px",
                    height: "30px",
                    borderRadius: "999px",
                    background: "rgba(56,189,248,0.15)",
                    color: "#38bdf8",
                    fontSize: 18,
                  }}
                >
                  ⌕
                </span>
                Ask about Aryan's projects, research, or experience…
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "999px",
                  background: "rgba(99,102,241,0.3)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "45%",
                    height: "100%",
                    background: "linear-gradient(90deg, rgba(56,189,248,0.7), rgba(99,102,241,0.9))",
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                borderRadius: "28px",
                border: "1px solid rgba(56,189,248,0.3)",
                background: "linear-gradient(180deg, rgba(8,13,28,0.92), rgba(6,9,22,0.96))",
                padding: "26px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Telemetry Feed
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {telemetry.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      paddingBottom: "10px",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: 14,
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {item.label}
                      </span>
                      <span style={{ fontSize: 16, color: "rgba(255,255,255,0.68)" }}>
                        {item.detail}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#38bdf8",
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
