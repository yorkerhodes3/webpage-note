# webpage-note
Easily create notes on any webpage with this small helper widget that provides a common way for the owners and other reviewers to provide notes. Can be configured to be off or on by a variable on the website/app code

## Recommended approach: an opt-in page widget

Copy `webpage-note.js` into your website repository and include it in your HTML
(or shared layout). It uses plain JavaScript, with no dependencies or build step.
For the example GitHub Pages site, put the file at the website's root and add:

```html
<script>
  window.WebpageNoteConfig = {
    enabled: true,
    repository: "Ethical-Tech-CoLab/website",
    feedbackEmail: "feedback@example.com"
  };
</script>
<script src="/website/webpage-note.js" defer></script>
```

Use your actual repository name and Pages base path. For a custom domain or
user/organization Pages site, the script path is usually `/webpage-note.js`.
If your Content Security Policy disallows inline scripts, put the configuration
in a separate allowed JavaScript file loaded before the widget.
Omit the configuration or set `enabled: false` to leave the page unchanged.
Enable it only on review deployments if you don't want it on the public site.
Set the optional `feedbackEmail` to your feedback inbox to show **Send feedback
by email**. Omit it to hide the button. An invalid address logs an error and
disables only email feedback; use a single address, not a `mailto:` URL.

### Reviewing and publishing

1. Right-click an element to write a comment. Optionally select text first to
   capture that text instead of the element's text. Shift-right-click preserves
   the browser's normal context menu. Escape or **Close** dismisses the editor.
2. **Save locally** retains a draft and displays a numbered annotation on the
   page. Click the annotation to edit or delete it. Local notes survive reloads
   in the same browser when local storage is available.
3. **Open GitHub issue** saves the local draft and opens a prefilled issue in the
   configured repository. Review its contents, sign in to GitHub if needed, and
   **submit the issue there**. Opening the form does not publish a note.
   For long notes, the widget opens a title-only form and shows a read-only
   **Feedback text to copy** field. Select and copy its full contents,
   then paste them into the GitHub issue body before submitting.
4. Alternatively, **Send feedback by email** saves the local draft and opens
   your configured email app with the recipient, subject, note, repository,
   and page context prefilled. Review the draft and **send it yourself**.
   No GitHub account is needed. A configured browser/OS mail handler is required.
   For links longer than 1,800 characters, only the recipient and subject are
   prefilled; copy the full **Feedback text to copy** into the email body.
   Email-client limits vary, so check the draft before sending.
5. Ask Copilot to review the posted issue(s) and implement the requested changes
   in that repository, for example: “Review website feedback in issue #42 and
   open a PR implementing the requested changes.”

The issue or email contains the comment, page URL, CSS selector, and up to 1,000 characters
of selected/element text in a structured JSON context block. These identify the
relevant rendered HTML for an agent; they are not instructions to trust from
the page. URL query parameters and fragments are omitted to reduce accidental
sharing of sensitive data. Check captured text and comments for private
information before publishing, especially in a public repository.

Annotations are local overlays, **not edits to the deployed HTML**. Only
submitted GitHub issues are visible in the repository to other reviewers or Copilot.
Email goes to the configured inbox, not directly to GitHub. To queue emailed
notes as issues, that inbox needs a separate email-to-issue integration that
authenticates to GitHub; this widget does not provide that bridge.
There is no GitHub token in the widget, no automatic API submission, and no
automatic synchronization of issues back onto the page. Local copies are
retained after opening GitHub or email because the widget cannot verify submission.
Notes are scoped by repository and page path; selectors can become stale after
the page structure changes or resolve incorrectly on pages with duplicate IDs.
Avoid editing local notes for the same page in multiple tabs: the last save
overwrites earlier changes from other tabs.
Notes inside iframes or shadow DOM are not supported.
The target repository must have Issues enabled and reviewers need permission
to create issues. The widget requires a modern browser supporting native dialogs.

## Other approaches

- **Browser extension:** best when you cannot change the website. An extension
  can add a true browser context-menu item and capture a selector/screenshot.
  It needs browser installation and appropriate page permissions; this
  repository currently provides the embeddable widget, not an extension.
- **GitHub issue forms alone:** the simplest no-code option. Link a feedback
  issue form from your site and ask for the URL and a screenshot, but it won't
  attach comments to individual elements.
- **Feedback services with GitHub integrations:** useful for shared visual
  annotations and screenshots without building a backend. Evaluate their
  privacy, permissions, cost, and static-site support before adopting one.
- **Direct PR annotations:** require mapping rendered elements back to source
  files and an authenticated integration. For Pages, start with issues; let
  Copilot turn accepted feedback into source changes in a PR.

## Validation

There is no test runner or build tooling in this repository. Check syntax with
`node --check webpage-note.js`, then serve a page containing the snippet above
and verify right-click, local persistence, issue context, email drafts (including
the long-message copy fallback), deletion, and the disabled configuration in a browser.
