# RepurposeIQ

One source. Seven drafts. A human signs off.

RepurposeIQ is an n8n workflow that turns one published article into seven channel drafts built from the article's own sentences. Every number is matched to the sentence it came from, an editor reviews and edits on an n8n form, and the edits are checked again before anything is saved.

**Live site and in-browser demo:** https://dheeraj9xx.github.io/repurposeiq/
**Recording of a real run:** [docs/assets/repurposeiq-n8n-live-run.mp4](docs/assets/repurposeiq-n8n-live-run.mp4)

## What's in this repo

| Path | What it is |
| --- | --- |
| `workflow/repurposeiq.workflow.json` | The n8n workflow (14 nodes). Import it with Workflows → Import from file. |
| `workflow/logic.js` | The drafting and claim-check code used inside the workflow's Code nodes. |
| `runs/` | Unedited Markdown and JSON files written by n8n during three real runs on 23 Nov 2026. |
| `docs/` | The site, including a browser version of the same logic. |

## The workflow

1. **Submit a source:** n8n Form Trigger takes a Substack URL, an optional CTA link and the editor's name.
2. **Fetch the source:** HTTP Request to the post's public Substack API.
3. **Clean and split:** strips HTML and splits the text into numbered passages; reference lists and links are dropped.
4. **Extract claims and rank:** passages with numbers, named studies or a clear contrast rank higher.
5. **Draft 7 formats:** LinkedIn post, X thread, newsletter teaser, carousel outline, 45-second video script, sales follow-up email, quote cards. Source sentences are placed verbatim.
6. **Claim check and build review form:** every number must appear in the source inside matching wording.
7. **Editorial review (human):** n8n Form page; the editor edits drafts and approves or sends everything back.
8. **Re-check and package:** edited drafts are checked again; failures are blocked.
9. **Save:** Markdown and JSON files written to disk, plus a completion page.

## Runs

| Run | Source | Result |
| --- | --- | --- |
| [7](runs/run-7.md) | ChatGPT Just Gave You 300 Characters | 6 approved, 1 blocked: editor changed 61% to 71% on purpose |
| [5](runs/run-5.md) | ChatGPT Stopped Reading Your Blog | 6 approved, 1 blocked: editor changed 83% to 93% on purpose |
| [4](runs/run-4.md) | LinkedIn Just Hired a Bouncer | 7 of 7 approved |

Run durations in n8n include the time the workflow waited for the editor.

## Limits

- No AI model is called. Drafts are extractive templates; an editor adds voice.
- The claim check covers numbers and their surrounding wording, not tone or claims without numbers.
- Runs on a local n8n instance (n8n 2.48.7, Node 24). To run it yourself, set `N8N_RESTRICT_FILE_ACCESS_TO` to an output folder and update the two Write File paths.
- n8n input is Substack posts; the browser demo also accepts pasted text.

## Author

Dheeraj Kumar Singh · [LinkedIn](https://www.linkedin.com/in/dheeraj-singh-99b03688/) · [The Overlooked Memo](https://dheeraj9xx.substack.com/) · dheerajsingh2902@gmail.com
