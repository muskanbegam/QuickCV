        document.addEventListener('DOMContentLoaded', function () {
            const { jsPDF } = window.jspdf;

            const data = JSON.parse(sessionStorage.getItem('resumeData') || '{}');
            if (!data || Object.keys(data).length === 0) {
                document.getElementById('resume-container').innerHTML = '<p>No resume data found. Please go back and fill the form.</p>';
                document.getElementById('download-pdf').style.display = 'none';
                return;
            }

            const resumeContainer = document.getElementById('resume-container');
            const pageHeight = 1123;

            let currentPage = document.createElement('div');
            currentPage.classList.add('page');
            resumeContainer.appendChild(currentPage);

            function createSection(html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                tempDiv.style.marginBottom = '15px';
                return tempDiv;
            }

            const sectionsHTML = [];

            sectionsHTML.push(`
                <div class="page-section">
                    <h1>${data.personal.fullName}</h1>
                    <p class="contact">${data.personal.email} &bull; ${data.personal.phone}${data.personal.socialLinks && data.personal.socialLinks.length ? ' &bull; ' + data.personal.socialLinks.join(' &bull; ') : ''}</p>
                </div>
            `);

            if (data.summary) {
                const bullets = data.summary
                    .split(/(?<=\.|\?|!)/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                    .map(s => `<li>${s}</li>`).join('');
                sectionsHTML.push(`<div class="page-section"><h2>Summary</h2><ul>${bullets}</ul></div>`);
            }

            if (data.education && data.education.length) {
                const educationHTML = data.education.map(ed => `
                    <div class="education-entry">
                        <div style="display:flex; justify-content:space-between;"><strong>${ed.degree}</strong><span>${ed.end}</span></div>
                        <div>${ed.college}</div>
                    </div>
                `).join('');
                sectionsHTML.push(`<div class="page-section"><h2>Education</h2>${educationHTML}</div>`);
            }

            if (data.skills && data.skills.length) {
                sectionsHTML.push(`<div class="page-section"><h2>Skills</h2>${data.skills.map(sk => `<p><strong>${sk.category}:</strong> ${sk.skills}</p>`).join('')}</div>`);
            }

            if (data.projects && data.projects.length) {
                sectionsHTML.push(`<div class="page-section"><h2>Projects</h2>${data.projects.map(p => {
                    let bullets = '';
                    if (p.description) {
                        bullets = '<ul>' + p.description.split(/(?<=\.|\?|!)/).map(s => s.trim()).filter(s => s.length > 0).map(s => `<li>${s}</li>`).join('') + '</ul>';
                    }
                    return `<p><strong>${p.name}</strong> ${p.link ? ' — <a href="' + p.link + '">' + p.link + '</a>' : ''}</p>${bullets}`;
                }).join('')}</div>`);
            }

            if (data.experience && data.experience.length) {
                sectionsHTML.push(`<div class="page-section"><h2>Experience</h2>${data.experience.map(ex => {
                    let bullets = '';
                    if (ex.description) {
                        bullets = '<ul>' + ex.description.split(/(?<=\.|\?|!)/).map(s => s.trim()).filter(s => s.length > 0).map(s => `<li>${s}</li>`).join('') + '</ul>';
                    }
                    return `<p><strong>${ex.title}</strong> ${ex.company ? ' — ' + ex.company : ''} ${ex.duration ? '(' + ex.duration + ')' : ''}</p>${bullets}`;
                }).join('')}</div>`);
            }

            if (data.customSections && data.customSections.length) {
                sectionsHTML.push(...data.customSections.map(cs => `<div class="page-section"><h2>${cs.heading}</h2><p>${cs.content}</p></div>`));
            }

            if (data.certifications && data.certifications.length) {
                const certificationsHTML = data.certifications.map(c => `
                    <div class="certification-entry">
                        <div style="display:flex; justify-content:space-between;"><strong>${c.name}</strong><span>${c.year}</span></div>
                        <div>${c.issuer}</div>
                    </div>
                `).join('');
                sectionsHTML.push(`<div class="page-section"><h2>Certifications</h2>${certificationsHTML}</div>`);
            }

            sectionsHTML.forEach(html => {
                const section = createSection(html);
                currentPage.appendChild(section);
                if (currentPage.scrollHeight > pageHeight) {
                    currentPage.removeChild(section);
                    currentPage = document.createElement('div');
                    currentPage.classList.add('page');
                    resumeContainer.appendChild(currentPage);
                    currentPage.appendChild(section);
                }
            });

            const popup = document.getElementById('download-popup');
            const filenameInput = document.getElementById('pdf-filename');
            const confirmDownload = document.getElementById('confirm-download');
            const cancelDownload = document.getElementById('cancel-download');
            const successMessage = document.getElementById('success-message');

            document.getElementById('download-pdf').addEventListener('click', () => {
                popup.style.display = 'flex';
                filenameInput.value = data.personal.fullName.replace(/\s+/g, '_') + "_Resume";
                filenameInput.focus();
            });

            cancelDownload.addEventListener('click', () => popup.style.display = 'none');

            confirmDownload.addEventListener('click', async () => {
                const filename = filenameInput.value.trim() || "Resume";
                popup.style.display = 'none';
                const pdf = new jsPDF('p', 'pt', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();

                try {
                    const pages = document.querySelectorAll('.page');
                    for (let i = 0; i < pages.length; i++) {
                        const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                        const imgData = canvas.toDataURL('image/png');
                        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                        if (i < pages.length - 1) pdf.addPage();
                    }
                    pdf.save(filename + ".pdf");
                    successMessage.style.display = 'block';
                    setTimeout(() => { successMessage.style.display = 'none'; }, 3000);
                } catch (err) {
                    console.error(err);
                    alert('Error generating PDF. Please try again.');
                }
            });
        });
