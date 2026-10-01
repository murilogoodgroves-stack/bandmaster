import type { ProductionProject } from '../types';

export type ReleasePageTemplate = 'classic' | 'editorial' | 'minimal';

export interface MailchimpConfig {
  apiKey: string;
  serverPrefix: string;
  listId: string;
}

export interface ReleaseLandingPageOptions {
  project: Pick<ProductionProject, 'id' | 'name' | 'type' | 'status' | 'targetReleaseDate' | 'description' | 'strategicGoal' | 'bandId'> & {
    songIds?: string[];
    milestones?: Array<{ id: string; title?: string; status?: string }>;
    deliverables?: Array<{ id: string; title?: string; status?: string }>;
  };
  bandName: string;
  prompt?: string;
  template?: ReleasePageTemplate;
}

const escapeHtml = (value: string = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const defaultPressPrompt = 'Create a refined classic editorial release page with the right mood, key links, artwork, track highlights, and a strong CTA for press and fans.';

export const getProjectReleaseUrl = (projectId: string) => `#/release/${projectId}`;

export const generateReleaseLandingPage = (
  project: Pick<ProductionProject, 'id' | 'name' | 'type' | 'status' | 'targetReleaseDate' | 'description' | 'strategicGoal' | 'bandId'> & {
    songIds?: string[];
    milestones?: Array<{ id: string; title?: string; status?: string }>;
    deliverables?: Array<{ id: string; title?: string; status?: string }>;
  },
  bandName: string,
  prompt: string = defaultPressPrompt,
  template: ReleasePageTemplate = 'classic'
) => {
  const title = project.name || 'New Release';
  const subtitle = project.type || 'Release';
  const description = project.description || 'A new chapter in the story of the band.';
  const goal = project.strategicGoal || 'Welcome new listeners and deepen connection with the audience.';
  const releaseDate = project.targetReleaseDate ? new Date(project.targetReleaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBA';
  const pageUrl = getProjectReleaseUrl(project.id);

  const palette = template === 'minimal'
    ? { bg: '#f5f1ea', panel: '#ffffff', ink: '#171717', accent: '#8b6f47', accentSoft: '#efe4d3', border: '#d6cab8' }
    : template === 'editorial'
      ? { bg: '#f3efe8', panel: '#f9f6f0', ink: '#171412', accent: '#7e5c3a', accentSoft: '#e6d9c7', border: '#d3c2a7' }
      : { bg: '#0f0f10', panel: '#171719', ink: '#f3f2ee', accent: '#d3b57d', accentSoft: '#2a2a2d', border: '#453d31' };

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)} | ${escapeHtml(bandName)}</title>
      <meta name="description" content="${escapeHtml(description)}" />
      <style>
        body {
          margin: 0;
          background: ${palette.bg};
          color: ${palette.ink};
          font-family: Georgia, 'Times New Roman', serif;
          line-height: 1.6;
        }
        a { color: inherit; }
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 72px;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid ${palette.border};
          padding-bottom: 18px;
          margin-bottom: 30px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .hero {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 28px;
          align-items: center;
          background: ${palette.panel};
          border: 1px solid ${palette.border};
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.08);
        }
        .eyebrow {
          color: ${palette.accent};
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 700;
        }
        h1 {
          font-size: clamp(2.5rem, 5vw, 5rem);
          line-height: 0.96;
          margin: 14px 0 16px;
          font-weight: 700;
        }
        .subtitle {
          margin-bottom: 18px;
          color: ${palette.accent};
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          color: ${palette.ink};
          opacity: 0.8;
          font-size: 13px;
          margin-bottom: 24px;
        }
        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }
        .button {
          display: inline-block;
          border-radius: 999px;
          padding: 14px 22px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          text-decoration: none;
          font-weight: 700;
        }
        .primary { background: ${palette.accent}; color: #fff7eb; }
        .secondary { background: transparent; color: ${palette.ink}; border: 1px solid ${palette.border}; }
        .art {
          background: linear-gradient(135deg, ${palette.accentSoft}, #0e0e10);
          border: 1px solid ${palette.border};
          border-radius: 18px;
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${palette.ink};
          font-weight: 700;
          text-align: center;
          padding: 24px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 26px;
        }
        .card {
          background: ${palette.panel};
          border: 1px solid ${palette.border};
          border-radius: 16px;
          padding: 20px;
        }
        .card h3 {
          margin: 0 0 12px;
          font-size: 13px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${palette.accent};
        }
        .card p {
          margin: 0;
          font-size: 15px;
        }
        .story {
          margin-top: 30px;
          background: ${palette.panel};
          border: 1px solid ${palette.border};
          border-radius: 18px;
          padding: 28px;
        }
        .story p {
          margin: 0 0 14px;
          font-size: 17px;
        }
        @media (max-width: 820px) {
          .hero, .grid { grid-template-columns: 1fr; }
          .topbar { letter-spacing: 0.08em; }
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="topbar">
          <div>${escapeHtml(bandName)}</div>
          <div>${escapeHtml(subtitle)}</div>
        </div>

        <section class="hero">
          <div>
            <div class="eyebrow">${escapeHtml(subtitle)} • ${escapeHtml(project.status || 'New')}</div>
            <h1>${escapeHtml(title)}</h1>
            <div class="subtitle">${escapeHtml(releaseDate)}</div>
            <div class="meta">
              <span>${escapeHtml(bandName)}</span>
              <span>Press Release</span>
              <span>Public URL: ${escapeHtml(pageUrl)}</span>
            </div>
            <p>${escapeHtml(description)}</p>
            <div class="cta-row">
              <a href="${escapeHtml(pageUrl)}" class="button primary">Listen / Share</a>
              <a href="#press-kit" class="button secondary">Press Kit</a>
            </div>
          </div>
          <div class="art">Cover Art</div>
        </section>

        <section class="grid">
          <article class="card">
            <h3>Release</h3>
            <p>${escapeHtml(title)} arrives on ${escapeHtml(releaseDate)}.</p>
          </article>
          <article class="card">
            <h3>Message</h3>
            <p>${escapeHtml(goal)}</p>
          </article>
          <article class="card">
            <h3>Prompt</h3>
            <p>${escapeHtml(prompt || defaultPressPrompt)}</p>
          </article>
        </section>

        <section id="press-kit" class="story">
          <h3 class="eyebrow">Press notes</h3>
          <p>${escapeHtml(description)}</p>
          <p>${escapeHtml(goal)}</p>
          <p>This release-ready page is designed for early press outreach, release-day circulation, and ongoing fan discovery. It keeps the essentials in one elegant, shareable format.</p>
        </section>
      </div>
    </body>
  </html>`;
};

export interface NewsletterContentInput {
  projectName: string;
  artistName: string;
  releaseDate: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}

export const buildNewsletterEmailHtml = ({
  projectName,
  artistName,
  releaseDate,
  description,
  ctaText,
  ctaUrl,
}: NewsletterContentInput) => {
  const safeDate = releaseDate ? new Date(releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Soon';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(projectName)}</title>
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="margin:0;padding:0;background:#f4efe8;color:#171412;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Preheader: ${escapeHtml(description)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4efe8;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #d9ccb1;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a683c;font-weight:bold;">${escapeHtml(artistName)}</td>
            </tr>
            <tr>
              <td style="padding:0 24px 12px;">
                <div style="font-size:32px;line-height:1.1;font-weight:bold;color:#171412;">${escapeHtml(projectName)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 18px;color:#4d463f;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(safeDate)}</td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;">
                <div style="background:#f2e6d0;border-left:4px solid #8a683c;padding:16px 18px;color:#171412;font-size:15px;line-height:1.5;">
                  ${escapeHtml(description)}
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 30px;">
                <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#171412;color:#f8f2ea;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:bold;">${escapeHtml(ctaText)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;color:#5b564f;font-size:13px;line-height:1.6;">
                Thanks for being part of the journey.<br />
                ${escapeHtml(artistName)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const validateMailchimpConfig = ({ apiKey, serverPrefix, listId }: MailchimpConfig) => {
  const valid = Boolean(apiKey && serverPrefix && listId);
  return {
    valid,
    reason: valid ? 'ready' : 'Mailchimp API key, server prefix and list ID are required before sending.',
  };
};

export const buildMailchimpCampaignPayload = ({
  subject,
  fromName,
  replyTo,
  html,
  listId,
  title,
}: {
  subject: string;
  fromName: string;
  replyTo: string;
  html: string;
  listId: string;
  title: string;
}) => ({
  type: 'regular',
  content_type: 'template',
  recipients: {
    list_id: listId,
  },
  settings: {
    subject_line: subject,
    title,
    from_name: fromName || 'BandMate',
    reply_to: replyTo || 'hello@example.com',
    template_id: 0,
    auto_footer: false,
  },
  html,
});
