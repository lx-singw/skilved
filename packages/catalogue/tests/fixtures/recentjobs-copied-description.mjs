// Authored structural fixture and fictional notice; no vacancy snapshot.
export const copiedUrl = 'https://recentjobs.co.za/2026/09/26/fictional-copied-description/';
export const introduction = 'Fictional Workshop invites electrical apprentice applications.';
export const requirement = 'Applicants require Grade 12 with Mathematics OR N3 Electrical.';
export const copiedBody = `<p>${requirement}</p><p>Closing date: 30 October 2026</p>`;
export const description = body => '<article class="jobs-description__container jobs-description__container--condensed">' +
  '<div class="jobs-description__content jobs-description-content jobs-description__content--condensed">' +
  '<div id="job-details" class="jobs-box__html-content"><div>' + body + '</div></div></div></article>';
export function copiedDetail({body = copiedBody, before = `<p>${introduction}</p>`, after = '<a href="https://employer.example/apply?source=board">Apply now</a>'} = {}) {
  return '<!doctype html><html><head><link rel="canonical" href="' + copiedUrl + '"></head>' +
    '<body class="single-post postid-123"><main id="main" class="site-main">' +
    '<article id="post-123" class="post post-123 type-post"><header class="entry-header">' +
    '<h1 class="entry-title">Fictional electrical apprentice</h1><time class="published" datetime="2026-09-26T10:00:00+02:00">26 September</time></header>' +
    '<div class="entry-content">' + before + '<div class="copied-shell">' + description(body) + '</div>' + after + '</div>' +
    '<aside><article class="type-post"><h1 class="entry-title">Sidebar notice</h1><div class="entry-content">Closing date: 1 January 2099</div></article></aside>' +
    '</article></main></body></html>';
}
