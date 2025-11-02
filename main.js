// Drug interaction data
const interactionData = {
    'warfarin-aspirin': {
        severity: 'Major',
        description: 'Combined use increases risk of bleeding significantly.',
        recommendation: 'Monitor closely for signs of bleeding. Consider alternative antiplatelet if possible.',
        references: 'Clinical studies have shown increased risk of major bleeding events.'
    },
    'simvastatin-amiodarone': {
        severity: 'Major',
        description: 'Increased risk of myopathy/rhabdomyolysis due to increased simvastatin levels.',
        recommendation: 'Limit simvastatin dose to 20mg daily or consider alternative statin.',
        references: 'FDA drug safety communication (2011)'
    },
    'omeprazole-clopidogrel': {
        severity: 'Moderate',
        description: 'May reduce effectiveness of clopidogrel by inhibiting its conversion to active form.',
        recommendation: 'Consider using alternative acid-reducer like pantoprazole.',
        references: 'Multiple clinical studies and FDA warnings'
    },
    'ciprofloxacin-dairy': {
        severity: 'Moderate',
        description: 'Dairy products can significantly reduce ciprofloxacin absorption by chelation.',
        recommendation: 'Take ciprofloxacin 2 hours before or 6 hours after consuming dairy products.',
        references: 'Multiple pharmacokinetic studies showing reduced bioavailability.'
    }
    // Add more interactions as needed
};

// Main app functionality 
(function(){
    // External navigation handler
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (!a) return;

        const href = a.getAttribute('href') || '';

        if (a.dataset && a.dataset.external === 'true') {
            e.stopImmediatePropagation();
            return;
        }
        if (a.target === '_blank') {
            e.stopImmediatePropagation();
            return;
        }
        if (/^https?:\/\//i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
        if (href && /\.html(\b|$)/i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
    }, true);

    // Page navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hasAttribute('data-external') || 
                (this.getAttribute('href') && this.getAttribute('href').endsWith('.html'))) {
                return;
            }
            const page = this.dataset.page;
            if (!page) return;
            e.preventDefault();
            
            document.querySelectorAll('.page-section').forEach(sec => 
                sec.classList.remove('active')
            );
            const target = document.getElementById(page + '-page');
            if (target) target.classList.add('active');
            
            document.querySelector('.nav-menu')?.classList.remove('open');
        });
    });

    // Mobile menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    // Responsive search behavior
    initResponsiveSearch();

    // Universal search suggestion dropdown for all pages
    initUniversalSearchSuggestions();

    // Welcome alert
    initWelcomeAlert();

    // Tool modal
    initToolModal();

    // Drug interactions checker
    initInteractionChecker();

    // Alphabet filter & search
    initMedicineFilters();

    // Short utility and UI handlers for Clinical Tools
    initToolSystem();

    // Disease popup initialization - if needed
    function initDiseasePopup() {
        // Implementation can be added based on requirements
    }
    initDiseasePopup();

    // Disease suggestion dropdown for Disease Database page - if needed
    function initDiseaseSuggestionDropdown() {
        // Implementation can be added based on requirements
    }
    initDiseaseSuggestionDropdown();

    // Legal modals for Editorial Policy and Advertise With Us
    initLegalModals();
})();

// Helper functions
function initWelcomeAlert() {
    const container = document.getElementById('welcome-alert');
    const text = document.getElementById('welcome-text');
    const close = document.getElementById('close-welcome');
    
    try {
        const dismissed = localStorage.getItem('mims_welcome_dismissed');
        if (!dismissed && container && text) {
            const hour = new Date().getHours();
            let greeting = 'Welcome to MIMS ph — Trusted Medical Information';
            if (hour < 12) greeting = 'Good morning — Welcome to MIMS ph';
            else if (hour < 18) greeting = 'Good afternoon — Welcome to MIMS ph';
            text.textContent = greeting + '. This site is intended for healthcare professionals.';
            container.style.display = 'block';
        }
        if (close) {
            close.addEventListener('click', () => {
                container.style.display = 'none';
                try { localStorage.setItem('mims_welcome_dismissed', '1'); } catch(e){}
            });
        }
    } catch(e){}
}

function initToolModal() {
    const modal = document.getElementById('tool-modal');
    const title = document.getElementById('tool-title');
    const subtitle = document.getElementById('tool-subtitle');
    const body = document.getElementById('tool-body');
    const close = document.getElementById('tool-close');

    // Tool opening handlers
    document.querySelectorAll('.open-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            openTool(tool, modal, title, subtitle, body);
        });
    });

    // Close handlers
    if (close) close.addEventListener('click', () => closeToolModal(modal));
    
    // ESC key handler
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeToolModal(modal);
        }
    });
}

function initInteractionChecker() {
    const checkBtn = document.getElementById('check-interaction-btn');
    if (!checkBtn) return;

    checkBtn.addEventListener('click', () => {
        const drug1 = document.getElementById('drug1-select').value;
        const drug2 = document.getElementById('drug2-select').value;

        if (!drug1 || !drug2) {
            alert('Please select both medications');
            return;
        }

        if (drug1 === drug2) {
            alert('Please select two different medications');
            return;
        }

        checkInteraction(drug1, drug2);
    });
}

function initMedicineFilters() {
    const cards = Array.from(document.querySelectorAll('.medicine-card'));
    const alphaBtns = Array.from(document.querySelectorAll('.alphabet-btn'));
    const dbFilters = Array.from(document.querySelectorAll('.db-filter'));
    const searchInput = document.getElementById('search-input');
    
    let activeLetter = 'all';
    let activeView = 'all';

    function isGenericCard(card) {
        // Prefer explicit marker when available
        const dt = (card.getAttribute('data-type') || '').toLowerCase();
        if (dt === 'generic') return true;
        if (dt === 'brand') return false;

        // Fallback heuristic: inspect the "medicine-generic" text
        const genText = (card.querySelector('.medicine-generic')?.textContent || '').trim().toLowerCase();
        const nameText = (card.querySelector('.medicine-name')?.textContent || '').trim().toLowerCase();

        // If generic field equals the displayed name, treat as generic entry
        if (genText && nameText && genText === nameText) return true;

        // If generic field contains common generic-word markers or is a single simple token, treat as generic
        const genericMarkers = ['hydrochloride','sodium','trihydrate','acetate','phosphate','cilexetil','potassium','calcium','maleate','tartrate'];
        for (const m of genericMarkers) if (genText.includes(m)) return true;

        // If generic field explicitly mentions 'common brand' treat as generic (existing pattern)
        if (genText.includes('common brand') || genText.includes('common brands')) return true;

        // Otherwise assume brand (conservative default)
        return false;
    }

    function applyFilters() {
        cards.forEach(card => {
            const cardLetter = (card.getAttribute('data-letter') || '').toUpperCase();
            const matchesLetter = (activeLetter === 'all' || cardLetter === activeLetter.toUpperCase());
            
            const genericFlag = isGenericCard(card);
            
            let matchesView = true;
            if (activeView === 'brand') matchesView = !genericFlag;
            else if (activeView === 'generic') matchesView = genericFlag;
            
            card.style.display = (matchesLetter && matchesView) ? 'block' : 'none';
        });
    }

    // Alphabet filter
    if (alphaBtns.length) {
        alphaBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                alphaBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                activeLetter = this.getAttribute('data-letter') || 'all';
                applyFilters();
                if (searchInput) searchInput.value = '';
            });
        });
    }

    // Database view filters (from dropdown and in-page controls)
    if (dbFilters.length) {
        dbFilters.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                dbFilters.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                activeView = this.getAttribute('data-view') || 'all';
                applyFilters();
                
                // Update the page heading to reflect the current view
                const viewText = activeView === 'brand' ? 'Brand Name Medicines' : 
                               activeView === 'generic' ? 'Generic Medicines' : 
                               'A-Z Medicine Database';
                const title = document.querySelector('.section-title');
                if (title) title.textContent = viewText + ' (Philippines)';
            });
        });
    }

    // Search filter
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                searchMedicines(searchInput.value, cards, alphaBtns);
            }, 180);
        });
    }

    // Show all on initial load
    const allAlphaBtn = document.querySelector('.alphabet-btn[data-letter="all"]');
    if (allAlphaBtn) allAlphaBtn.click();
}

// Short utility and UI handlers for Clinical Tools
function initToolSystem() {
    function calculateBMI() {
        const weight = parseFloat(document.getElementById('bmi-weight')?.value);
        const height = parseFloat(document.getElementById('bmi-height')?.value);
        const resultDiv = document.getElementById('bmi-result');
        if (!weight || !height) {
            resultDiv.textContent = 'Please enter both weight and height.';
            return;
        }
        const bmi = weight / ((height/100) * (height/100));
        const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        resultDiv.innerHTML = `BMI: <strong>${bmi.toFixed(1)}</strong> — ${category}`;
    }

    // Make calculator functions globally available
    window.calculateBMI = calculateBMI;
}

// Utility functions
function openTool(toolId, modal, title, subtitle, body) {
    if (!modal) return;
    
    const toolConfig = getToolConfig(toolId);
    
    // use CSS-driven "open" state so centering/flex works reliably
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    title.textContent = toolConfig.title;
    subtitle.textContent = toolConfig.subtitle;
    body.innerHTML = toolConfig.html;

    // Attach specific tool handlers
    attachToolHandlers(toolId, body);
}

function closeToolModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

function checkInteraction(drug1, drug2) {
    const key1 = [drug1, drug2].join('-').toLowerCase();
    const key2 = [drug2, drug1].join('-').toLowerCase();
    const interaction = interactionData[key1] || interactionData[key2];
    
    displayInteractionResult(drug1, drug2, interaction);
}

function displayInteractionResult(drug1, drug2, interaction) {
    const resultDiv = document.getElementById('interaction-result');
    if (!resultDiv) return;

    if (interaction) {
        resultDiv.innerHTML = `
            <div class="medicine-header">
                <h3 class="medicine-name">${drug1.charAt(0).toUpperCase() + drug1.slice(1)} + ${drug2.charAt(0).toUpperCase() + drug2.slice(1)}</h3>
                <div class="medicine-generic">Severity: <span style="color:${getSeverityColor(interaction.severity)}">${interaction.severity}</span></div>
            </div>
            <div class="medicine-content">
                <p class="medicine-desc">${interaction.description}</p>
                <div style="margin-top:12px;">
                    <strong>Recommended action:</strong>
                    <p style="color:var(--gray);margin-top:6px;">${interaction.recommendation}</p>
                </div>
                <div style="margin-top:12px;">
                    <strong>References:</strong>
                    <p style="color:var(--gray);margin-top:6px;font-size:0.9rem;">${interaction.references}</p>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="medicine-header">
                <h3 class="medicine-name">${drug1.charAt(0).toUpperCase() + drug1.slice(1)} + ${drug2.charAt(0).toUpperCase() + drug2.slice(1)}</h3>
                <div class="medicine-generic">No significant interaction found</div>
            </div>
            <div class="medicine-content">
                <p class="medicine-desc">No significant interaction has been documented between these medications in our database. However, always consult full prescribing information and use clinical judgment.</p>
            </div>
        `;
    }
    resultDiv.style.display = 'block';
}

function getSeverityColor(severity) {
    const colors = {
        'Major': 'var(--danger)',
        'Moderate': 'var(--warning)',
        'Minor': 'var(--success)'
    };
    return colors[severity] || 'var(--gray)';
}

function filterMedicines(letter, cards) {
    cards.forEach(card => {
        const cardLetter = (card.dataset.letter || '').toUpperCase();
        card.style.display = (!letter || letter.toLowerCase() === 'all' || 
                            cardLetter === letter.toUpperCase()) ? '' : 'none';
    });
}

function searchMedicines(query, cards, alphabetBtns) {
    const q = query.trim().toLowerCase();
    cards.forEach(card => {
        if (!q) {
            card.style.display = '';
            return;
        }
        const name = (card.querySelector('.medicine-name')?.textContent || '').toLowerCase();
        const generic = (card.querySelector('.medicine-generic')?.textContent || '').toLowerCase();
        card.style.display = (name.includes(q) || generic.includes(q)) ? '' : 'none';
    });
    alphabetBtns.forEach(b => b.classList.remove('active'));
}

// Responsive search: toggle, focus, submit and outside click handling
function initResponsiveSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    if (!searchBar || !searchBtn || !searchInput) return;

    // On small screens, clicking the button toggles the input visibility first
    searchBtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!searchBar.classList.contains('active')) {
                e.preventDefault();
                searchBar.classList.add('active');
                // allow animation to finish then focus
                setTimeout(() => searchInput.focus(), 80);
                return;
            }
            // if already expanded, perform search
        }
        // Desktop behavior or expanded mobile: run global search
        performGlobalSearch();
    });

    // Enter key in search input triggers search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performGlobalSearch();
            // on mobile collapse after search
            if (window.innerWidth <= 768) searchBar.classList.remove('active');
        } else if (e.key === 'Escape') {
            searchBar.classList.remove('active');
            searchInput.blur();
        }
    });

    // Click outside closes expanded mobile search
    document.addEventListener('click', (ev) => {
        if (!searchBar.classList.contains('active')) return;
        if (ev.target.closest('.search-bar')) return;
        searchBar.classList.remove('active');
    });

    // Optional: on resize, ensure class state matches viewport
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) searchBar.classList.remove('active');
    });
}

// Universal search suggestion dropdown for all pages
function initUniversalSearchSuggestions() {
    const input = document.getElementById('search-input');
    if (!input) return;

    // Create or get the suggestion dropdown
    let sugg = document.getElementById('universal-suggestions');
    if (!sugg) {
        sugg = document.createElement('div');
        sugg.id = 'universal-suggestions';
        sugg.style.display = 'none';
        sugg.style.position = 'absolute';
        sugg.style.top = '100%';
        sugg.style.left = '0';
        sugg.style.width = '100%';
        sugg.style.background = '#fff';
        sugg.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
        sugg.style.borderRadius = '0 0 12px 12px';
        sugg.style.zIndex = '1001';
        sugg.style.maxHeight = '260px';
        sugg.style.overflowY = 'auto';
        sugg.style.fontSize = '1rem';
        input.parentNode.appendChild(sugg);
    }

    // Collect all searchable items on the page
    function getSearchList() {
        const medicines = Array.from(document.querySelectorAll('.medicine-card')).map(card => ({
            type: 'medicine',
            name: card.querySelector('.medicine-name')?.textContent?.trim() || '',
            subtitle: card.querySelector('.medicine-generic')?.textContent?.trim() || '',
            el: card
        }));

        const diseases = Array.from(document.querySelectorAll('.disease-info')).map(link => ({
            type: 'disease',
            name: link.textContent.replace(/[\n\r]/g, '').trim().replace(/^[▶▼•\s]+/, ''),
            subtitle: link.closest('.disease-category')?.querySelector('h3')?.textContent?.trim() || '',
            el: link
        }));
        const news = Array.from(document.querySelectorAll('.news-card')).map(card => ({
            type: 'news',
            name: card.querySelector('h3')?.textContent?.trim() || '',
            subtitle: card.querySelector('.news-date')?.textContent?.trim() || '',
            el: card
        }));
        return [...medicines, ...diseases, ...news];
    }

    let selIdx = -1;
    let lastResults = [];

    input.addEventListener('input', function() {
        const q = this.value.trim().toLowerCase();
        if (!q) { sugg.style.display = 'none'; sugg.innerHTML = ''; return; }
        const list = getSearchList();
        const matches = list.filter(item => 
            item.name.toLowerCase().includes(q) || 
            item.subtitle.toLowerCase().includes(q)
        );
        lastResults = matches;
        selIdx = -1;
        if (!matches.length) { sugg.style.display = 'none'; sugg.innerHTML = ''; return; }
        sugg.innerHTML = matches.map((item, i) => {
            let icon = item.type === 'medicine' ? '<i class="fas fa-pills" style="color:#2563eb;margin-right:8px;"></i>'
                : item.type === 'disease' ? '<i class="fas fa-stethoscope" style="color:#10b981;margin-right:8px;"></i>'
                : '<i class="fas fa-newspaper" style="color:#64748b;margin-right:8px;"></i>';
            return `
                <div class="universal-suggestion-item" data-idx="${i}" style="padding:10px 18px;cursor:pointer;border-bottom:1px solid #e2e8f0;">
                    <div style="display:flex;align-items:center;">
                        ${icon}
                        <div>
                            <div style="font-weight:500;">${item.name}</div>
                            ${item.subtitle ? `<div style="font-size:0.85em;color:var(--gray);margin-top:2px;">${item.subtitle}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        sugg.style.display = 'block';
    });

    sugg.addEventListener('mousedown', function(e) {
        const item = e.target.closest('.universal-suggestion-item');
        if (!item) return;
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        const match = lastResults[idx];
        if (match && match.el) {
            // Scroll to and highlight the element
            match.el.scrollIntoView({behavior:'smooth',block:'center'});
            match.el.classList.add('highlight');
            setTimeout(()=>match.el.classList.remove('highlight'), 1200);
            // Optionally, focus or open details if it's a link
            if (match.type === 'disease' && match.el.click) match.el.click();
        }
        sugg.style.display = 'none';
        input.value = match ? match.name : '';
        e.preventDefault();
    });

    // Hide suggestions on blur (with delay for click)
    input.addEventListener('blur', ()=>setTimeout(()=>{sugg.style.display='none';},120));

    // Keyboard navigation
    input.addEventListener('keydown', function(e) {
        const items = sugg.querySelectorAll('.universal-suggestion-item');
        if (!items.length || sugg.style.display !== 'block') return;
        if (e.key === 'ArrowDown') {
            selIdx = (selIdx+1) % items.length;
            items.forEach((it,i)=>it.style.background=i===selIdx?'#e0e7ff':'');
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            selIdx = (selIdx-1+items.length)%items.length;
            items.forEach((it,i)=>it.style.background=i===selIdx?'#e0e7ff':'');
            e.preventDefault();
        } else if (e.key === 'Enter' && selIdx>=0) {
            items[selIdx].dispatchEvent(new MouseEvent('mousedown'));
            selIdx = -1;
            e.preventDefault();
        }
    });
}

// Add this after initWelcomeAlert()
function initLegalModals() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');

    // Modal content
    const modalContent = {
        'editorial-policy': {
            title: 'Editorial Policy',
            content: `
                <h3 style="color:var(--primary);margin-bottom:16px;">Content Development & Review</h3>
                <p>Our editorial process ensures accuracy and reliability through:</p>
                <ul style="margin:12px 0;padding-left:20px;">
                    <li>Systematic review by medical experts</li>
                    <li>Regular updates based on latest clinical evidence</li>
                    <li>Strict compliance with medical guidelines</li>
                    <li>Independent verification of drug information</li>
                </ul>

                <h3 style="color:var(--primary);margin:20px 0 16px;">Editorial Independence</h3>
                <p>We maintain strict editorial independence from commercial interests. Our content is:</p>
                <ul style="margin:12px 0;padding-left:20px;">
                    <li>Written and reviewed by healthcare professionals</li>
                    <li>Based on peer-reviewed medical literature</li>
                    <li>Free from pharmaceutical company influence</li>
                    <li>Regularly audited for accuracy</li>
                </ul>

                <p style="margin-top:20px;font-style:italic;color:var(--gray);">Last updated: January 2025</p>
            `
        },
        'advertise': {
            title: 'Advertise With Us',
            content: `
                <h3 style="color:var(--primary);margin-bottom:16px;">Reach Healthcare Professionals</h3>
                <p>Connect with our audience of healthcare providers, including:</p>
                <ul style="margin:12px 0;padding-left:20px;">
                    <li>Physicians and Specialists</li>
                    <li>Pharmacists</li>
                    <li>Medical Residents and Students</li>
                    <li>Healthcare Organizations</li>
                </ul>

                <h3 style="color:var(--primary);margin:20px 0 16px;">Advertising Options</h3>
                <div style="background:var(--light);padding:16px;border-radius:8px;margin:12px 0;">
                    <h4 style="color:var(--dark);margin-bottom:8px;">Digital Advertising</h4>
                    <ul style="margin:8px 0;padding-left:20px;">
                        <li>Website Display Ads</li>
                        <li>Newsletter Sponsorship</li>
                        <li>Sponsored Content</li>
                    </ul>
                </div>

                <p style="margin-top:20px;">
                    For advertising inquiries, contact us at:<br>
                    <strong>Email:</strong> advertising@mimsph.com<br>
                    <strong>Phone:</strong> (555) 123-4567
                </p>
            `
        }
    };

    // Handle link clicks
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                const type = this.textContent.trim().toLowerCase().includes('policy') ? 'editorial-policy' : 'advertise';
                const content = modalContent[type];
                if (content) {
                    modalTitle.textContent = content.title;
                    modalBody.innerHTML = content.content;
                    modalOverlay.style.display = 'block';
                    // Prevent body scroll when modal is open
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });

    // Close modal
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = '';
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.style.display === 'block') {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}

// Add to main initialization
(function(){
    // External navigation handler
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (!a) return;

        const href = a.getAttribute('href') || '';

        if (a.dataset && a.dataset.external === 'true') {
            e.stopImmediatePropagation();
            return;
        }
        if (a.target === '_blank') {
            e.stopImmediatePropagation();
            return;
        }
        if (/^https?:\/\//i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
        if (href && /\.html(\b|$)/i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
    }, true);

    // Page navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hasAttribute('data-external') || 
                (this.getAttribute('href') && this.getAttribute('href').endsWith('.html'))) {
                return;
            }
            const page = this.dataset.page;
            if (!page) return;
            e.preventDefault();
            
            document.querySelectorAll('.page-section').forEach(sec => 
                sec.classList.remove('active')
            );
            const target = document.getElementById(page + '-page');
            if (target) target.classList.add('active');
            
            document.querySelector('.nav-menu')?.classList.remove('open');
        });
    });

    // Mobile menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    // Responsive search behavior
    initResponsiveSearch();

    // Universal search suggestion dropdown for all pages
    initUniversalSearchSuggestions();

    // Welcome alert
    initWelcomeAlert();

    // Tool modal
    initToolModal();

    // Drug interactions checker
    initInteractionChecker();

    // Alphabet filter & search
    initMedicineFilters();

    // Short utility and UI handlers for Clinical Tools
    initToolSystem();

    // Disease popup initialization
    initDiseasePopup();

    // Disease suggestion dropdown for Disease Database page
    initDiseaseSuggestionDropdown();

    // Legal modals for Editorial Policy and Advertise With Us
    initLegalModals();
})();

// Helper functions
function initWelcomeAlert() {
    const container = document.getElementById('welcome-alert');
    const text = document.getElementById('welcome-text');
    const close = document.getElementById('close-welcome');
    
    try {
        const dismissed = localStorage.getItem('mims_welcome_dismissed');
        if (!dismissed && container && text) {
            const hour = new Date().getHours();
            let greeting = 'Welcome to MIMS ph — Trusted Medical Information';
            if (hour < 12) greeting = 'Good morning — Welcome to MIMS ph';
            else if (hour < 18) greeting = 'Good afternoon — Welcome to MIMS ph';
            text.textContent = greeting + '. This site is intended for healthcare professionals.';
            container.style.display = 'block';
        }
        if (close) {
            close.addEventListener('click', () => {
                container.style.display = 'none';
                try { localStorage.setItem('mims_welcome_dismissed', '1'); } catch(e){}
            });
        }
    } catch(e){}
}

function initToolModal() {
    const modal = document.getElementById('tool-modal');
    const title = document.getElementById('tool-title');
    const subtitle = document.getElementById('tool-subtitle');
    const body = document.getElementById('tool-body');
    const close = document.getElementById('tool-close');

    // Tool opening handlers
    document.querySelectorAll('.open-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            openTool(tool, modal, title, subtitle, body);
        });
    });

    // Close handlers
    if (close) close.addEventListener('click', () => closeToolModal(modal));
    
    // ESC key handler
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeToolModal(modal);
        }
    });
}

function initInteractionChecker() {
    const checkBtn = document.getElementById('check-interaction-btn');
    if (!checkBtn) return;

    checkBtn.addEventListener('click', () => {
        const drug1 = document.getElementById('drug1-select').value;
        const drug2 = document.getElementById('drug2-select').value;

        if (!drug1 || !drug2) {
            alert('Please select both medications');
            return;
        }

        if (drug1 === drug2) {
            alert('Please select two different medications');
            return;
        }

        checkInteraction(drug1, drug2);
    });
}

function initMedicineFilters() {
    const cards = Array.from(document.querySelectorAll('.medicine-card'));
    const alphaBtns = Array.from(document.querySelectorAll('.alphabet-btn'));
    const dbFilters = Array.from(document.querySelectorAll('.db-filter'));
    const searchInput = document.getElementById('search-input');
    
    let activeLetter = 'all';
    let activeView = 'all';

    function isGenericCard(card) {
        // Prefer explicit marker when available
        const dt = (card.getAttribute('data-type') || '').toLowerCase();
        if (dt === 'generic') return true;
        if (dt === 'brand') return false;

        // Fallback heuristic: inspect the "medicine-generic" text
        const genText = (card.querySelector('.medicine-generic')?.textContent || '').trim().toLowerCase();
        const nameText = (card.querySelector('.medicine-name')?.textContent || '').trim().toLowerCase();

        // If generic field equals the displayed name, treat as generic entry
        if (genText && nameText && genText === nameText) return true;

        // If generic field contains common generic-word markers or is a single simple token, treat as generic
        const genericMarkers = ['hydrochloride','sodium','trihydrate','acetate','phosphate','cilexetil','potassium','calcium','maleate','tartrate'];
        for (const m of genericMarkers) if (genText.includes(m)) return true;

        // If generic field explicitly mentions 'common brand' treat as generic (existing pattern)
        if (genText.includes('common brand') || genText.includes('common brands')) return true;

        // Otherwise assume brand (conservative default)
        return false;
    }

    function applyFilters() {
        cards.forEach(card => {
            const cardLetter = (card.getAttribute('data-letter') || '').toUpperCase();
            const matchesLetter = (activeLetter === 'all' || cardLetter === activeLetter.toUpperCase());
            
            const genericFlag = isGenericCard(card);
            
            let matchesView = true;
            if (activeView === 'brand') matchesView = !genericFlag;
            else if (activeView === 'generic') matchesView = genericFlag;
            
            card.style.display = (matchesLetter && matchesView) ? 'block' : 'none';
        });
    }

    // Alphabet filter
    if (alphaBtns.length) {
        alphaBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                alphaBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                activeLetter = this.getAttribute('data-letter') || 'all';
                applyFilters();
                if (searchInput) searchInput.value = '';
            });
        });
    }

    // Database view filters (from dropdown and in-page controls)
    if (dbFilters.length) {
        dbFilters.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                dbFilters.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                activeView = this.getAttribute('data-view') || 'all';
                applyFilters();
                
                // Update the page heading to reflect the current view
                const viewText = activeView === 'brand' ? 'Brand Name Medicines' : 
                               activeView === 'generic' ? 'Generic Medicines' : 
                               'A-Z Medicine Database';
                const title = document.querySelector('.section-title');
                if (title) title.textContent = viewText + ' (Philippines)';
            });
        });
    }

    // Search filter
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                searchMedicines(searchInput.value, cards, alphaBtns);
            }, 180);
        });
    }

    // Show all on initial load
    const allAlphaBtn = document.querySelector('.alphabet-btn[data-letter="all"]');
    if (allAlphaBtn) allAlphaBtn.click();
}

// Short utility and UI handlers for Clinical Tools
function initToolSystem() {
    function calculateBMI() {
        const weight = parseFloat(document.getElementById('bmi-weight')?.value);
        const height = parseFloat(document.getElementById('bmi-height')?.value);
        const resultDiv = document.getElementById('bmi-result');
        if (!weight || !height) {
            resultDiv.textContent = 'Please enter both weight and height.';
            return;
        }
        const bmi = weight / ((height/100) * (height/100));
        const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        resultDiv.innerHTML = `BMI: <strong>${bmi.toFixed(1)}</strong> — ${category}`;
    }

    // Make calculator functions globally available
    window.calculateBMI = calculateBMI;
}

function getToolConfig(toolId) {
    const commonInputStyle = 'width:100%;padding:12px;margin:8px 0;border:1px solid #e2e8f0;border-radius:8px;font-size:1rem;';
    const commonButtonStyle = 'width:100%;padding:12px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:1rem;font-weight:500;cursor:pointer;margin-top:16px;';
    const resultStyle = 'margin-top:20px;padding:16px;border-radius:8px;background:#f8fafc;';

    switch(toolId) {
        case 'bmi':
            return {
                title: 'BMI Calculator',
                subtitle: 'Calculate Body Mass Index',
                html: `
                    <div class="calculator-container">
                        <div class="input-group">
                            <label for="bmi-weight">Weight (kg)</label>
                            <input type="number" id="bmi-weight" placeholder="Enter weight" style="${commonInputStyle}">
                        </div>
                        <div class="input-group">
                            <label for="bmi-height">Height (cm)</label>
                            <input type="number" id="bmi-height" placeholder="Enter height" style="${commonInputStyle}">
                        </div>
                        <button onclick="calculateBMI()" style="${commonButtonStyle}">Calculate BMI</button>
                        <div id="bmi-result" style="${resultStyle}"></div>
                    </div>
                `
            };

        case 'egfr':
            return {
                title: 'eGFR Calculator',
                subtitle: 'Estimate Glomerular Filtration Rate',
                html: `
                    <div class="calculator-container">
                        <div class="input-group">
                            <label for="egfr-age">Age (years)</label>
                            <input type="number" id="egfr-age" placeholder="Enter age" style="${commonInputStyle}">
                        </div>
                        <div class="input-group">
                            <label>Sex</label>
                            <select id="egfr-sex" style="${commonInputStyle}">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="egfr-scr">Serum Creatinine (mg/dL)</label>
                            <input type="number" id="egfr-scr" step="0.1" placeholder="Enter creatinine" style="${commonInputStyle}">
                        </div>
                        <div class="input-group">
                            <label>Race</label>
                            <select id="egfr-race" style="${commonInputStyle}">
                                <option value="non-black">Non-Black</option>
                                <option value="black">Black</option>
                            </select>
                        </div>
                        <button onclick="calculateEGFR()" style="${commonButtonStyle}">Calculate eGFR</button>
                        <div id="egfr-result" style="${resultStyle}"></div>
                    </div>
                `
            };
        // Add more tools as needed...
    }
}

function attachToolHandlers(toolId, container) {
    if (toolId === 'bmi') {
        window.calculateBMI = function() {
            const weight = parseFloat(document.getElementById('bmi-weight').value);
            const height = parseFloat(document.getElementById('bmi-height').value);
            const resultDiv = document.getElementById('bmi-result');
            
            if (!weight || !height) {
                resultDiv.innerHTML = '<div class="alert alert-warning">Please enter both weight and height.</div>';
                return;
            }

            const bmi = weight / Math.pow(height/100, 2);
            let category, color;

            if (bmi < 18.5) {
                category = 'Underweight';
                color = '#eab308'; // yellow
            } else if (bmi < 25) {
                category = 'Normal';
                color = '#22c55e'; // green
            } else if (bmi < 30) {
                category = 'Overweight';
                color = '#f97316'; // orange
            } else {
                category = 'Obese';
               
            }

            resultDiv.innerHTML = `
                <div style="text-align:center;padding:12px;">
                    <div style="font-size:2rem;font-weight:600;color:${color};">${bmi.toFixed(1)}</div>
                    <div style="font-size:1.1rem;margin-top:8px;">${category}</div>
                    <div style="font-size:0.9rem;color:#64748b;margin-top:4px;">kg/m²</div>
                </div>
            `;
        };
    }
    // Add more calculator handlers...
}

document.addEventListener('DOMContentLoaded', function() {

	// Disease suggestion dropdown logic (moved from HTML)
	(function() {
		const input = document.getElementById('search-input');
		const sugg = document.getElementById('disease-suggestions');
		if (!input || !sugg) return;
		// Collect all disease links and names
		const diseaseLinks = Array.from(document.querySelectorAll('.disease-info'));
		const diseaseList = diseaseLinks.map(link => ({
			name: link.textContent.trim(),
			key: link.getAttribute('data-disease'),
			el: link
		}));
		input.addEventListener('input', function() {
			const q = this.value.trim().toLowerCase();
			if (!q) { sugg.style.display = 'none'; sugg.innerHTML = ''; return; }
			const matches = diseaseList.filter(d => d.name.toLowerCase().includes(q));
			if (!matches.length) { sugg.style.display = 'none'; sugg.innerHTML = ''; return; }
			sugg.innerHTML = matches.map(d =>
				`<div class="disease-suggestion-item" data-key="${d.key}" style="padding:10px 18px;cursor:pointer;border-bottom:1px solid #e2e8f0;">${d.name}</div>`
			).join('');
			sugg.style.display = 'block';
		});
		sugg.addEventListener('mousedown', function(e) {
			const item = e.target.closest('.disease-suggestion-item');
			if (!item) return;
			const key = item.getAttribute('data-key');
			const match = diseaseList.find(d => d.key === key);
			if (match && match.el) {
				match.el.scrollIntoView({behavior:'smooth',block:'center'});
				match.el.classList.add('highlight');
				setTimeout(()=>match.el.classList.remove('highlight'), 1200);
			}
			sugg.style.display = 'none';
			input.value = match ? match.name : '';
			e.preventDefault();
		});
		// Hide suggestions on blur (with delay for click)
		input.addEventListener('blur', ()=>setTimeout(()=>{sugg.style.display='none';},120));
		// Optional: highlight on keyboard navigation
		let selIdx = -1;
		input.addEventListener('keydown', function(e) {
			const items = sugg.querySelectorAll('.disease-suggestion-item');
			if (!items.length || sugg.style.display !== 'block') return;
			if (e.key === 'ArrowDown') {
				selIdx = (selIdx+1) % items.length;
				items.forEach((it,i)=>it.style.background=i===selIdx?'#e0e7ff':'');
				e.preventDefault();
			} else if (e.key === 'ArrowUp') {
				selIdx = (selIdx-1+items.length)%items.length;
				items.forEach((it,i)=>it.style.background=i===selIdx?'#e0e7ff':'');
				e.preventDefault();
			} else if (e.key === 'Enter' && selIdx>=0) {
				items[selIdx].dispatchEvent(new MouseEvent('mousedown'));
				selIdx = -1;
				e.preventDefault();
			}
		});
	})();

	// Disease popup logic 
	(function(){
		const popup = document.getElementById('disease-popup');
		const popupTitle = document.getElementById('disease-popup-title');
		const popupBody = document.getElementById('disease-popup-body');
		const popupClose = document.getElementById('disease-popup-close');

		// FULL disease data map — keys match data-disease attributes.
		const diseaseData = {
			"hypertension": {
				title: "Hypertension",
				description: "A chronic condition where arterial blood pressure is persistently elevated, increasing cardiovascular risk.",
				causes: "Genetics, high salt intake, obesity, sedentary lifestyle, renal disease, endocrine disorders.",
				symptoms: "Often asymptomatic; may cause headaches, dizziness, visual changes, chest pain in severe cases."
			},
			"coronary-artery-disease": {
				title: "Coronary Artery Disease",
				description: "Atherosclerotic narrowing of coronary arteries causing myocardial ischemia.",
				causes: "Atherosclerosis from hyperlipidemia, smoking, diabetes, hypertension, family history.",
				symptoms: "Angina (exertional chest pain), dyspnea, fatigue; can present with MI (acute chest pain, sweating)."
			},
			"heart-failure": {
				title: "Heart Failure",
				description: "Syndrome of impaired cardiac output or elevated intracardiac pressures leading to congestion.",
				causes: "Ischemic heart disease, hypertension, cardiomyopathy, valvular disease, arrhythmias.",
				symptoms: "Dyspnea on exertion, orthopnea, edema, fatigue, reduced exercise tolerance."
			},
			"arrhythmias": {
				title: "Arrhythmias",
				description: "Abnormal heart rhythms due to electrical conduction disturbances.",
				causes: "Ischemia, electrolyte disturbances, structural heart disease, drugs, congenital conditions.",
				symptoms: "Palpitations, dizziness, syncope, fatigue, in severe cases sudden collapse."
			},
			"stroke": {
				title: "Stroke",
				description: "Acute focal neurological deficit from cerebral ischemia or hemorrhage.",
				causes: "Thromboembolism, large-artery atherosclerosis, small-vessel disease, hemorrhage, cardioembolism.",
				symptoms: "Sudden weakness/numbness, speech disturbance, visual loss, severe headache (hemorrhage)."
			},
			"peripheral-artery-disease": {
				title: "Peripheral Artery Disease",
				description: "Atherosclerotic obstruction of peripheral arteries causing limb ischemia.",
				causes: "Atherosclerosis related to smoking, diabetes, hypertension, hyperlipidemia.",
				symptoms: "Intermittent claudication (exercise leg pain), rest pain, non-healing ulcers in advanced disease."
			},
			"asthma": {
				title: "Asthma",
				description: "Chronic inflammatory airway disease with variable airflow obstruction and bronchial hyperresponsiveness.",
				causes: "Allergens, viral infections, exercise, occupational exposures, atopy.",
				symptoms: "Wheezing, cough (often nocturnal), chest tightness, shortness of breath."
			},
			"copd": {
				title: "Chronic Obstructive Pulmonary Disease (COPD)",
				description: "Progressive airflow limitation usually caused by smoking, with emphysema and chronic bronchitis components.",
				causes: "Tobacco smoke, air pollution, occupational exposures, alpha-1 antitrypsin deficiency.",
				symptoms: "Chronic cough, sputum production, progressive dyspnea, recurrent exacerbations."
			},
			"pneumonia": {
				title: "Pneumonia",
				description: "Infection of the lung parenchyma causing consolidation and systemic symptoms.",
				causes: "Bacterial (e.g., S. pneumoniae), viral (influenza), aspiration, fungal organisms in immunocompromised.",
				symptoms: "Fever, productive cough, pleuritic chest pain, dyspnea, sputum changes."
			},
			"tuberculosis": {
				title: "Tuberculosis",
				description: "Mycobacterial infection (usually M. tuberculosis) primarily affecting lungs; can be latent or active.",
				causes: "Airborne transmission of M. tuberculosis; reactivation with immunosuppression.",
				symptoms: "Chronic cough, hemoptysis, weight loss, night sweats, fever, fatigue."
			},
			"influenza": {
				title: "Influenza",
				description: "Acute viral respiratory illness caused by influenza A/B viruses with seasonal epidemics.",
				causes: "Infection with influenza viruses; transmission via droplets/contact.",
				symptoms: "Fever, myalgia, headache, cough, sore throat, fatigue; complications include pneumonia."
			},
			"covid-19": {
				title: "COVID-19",
				description: "Viral illness caused by SARS-CoV-2 ranging from asymptomatic to severe pneumonia and multisystem disease.",
				causes: "SARS-CoV-2 infection via respiratory droplets and aerosols.",
				symptoms: "Fever, cough, dyspnea, anosmia, fatigue, myalgias; severe cases: hypoxia, ARDS, thrombotic events."
			},
			"alzheimers": {
				title: "Alzheimer's Disease",
				description: "Progressive neurodegenerative disorder causing memory loss and cognitive decline.",
				causes: "Amyloid-beta accumulation, tau pathology, genetic and age-related factors.",
				symptoms: "Memory impairment, language problems, disorientation, progressive decline in daily functioning."
			},
			"parkinsons": {
				title: "Parkinson's Disease",
				description: "Neurodegenerative movement disorder due to dopaminergic neuron loss in the substantia nigra.",
				causes: "Idiopathic in most cases; genetics and environmental factors implicated.",
				symptoms: "Tremor, bradykinesia, rigidity, postural instability, possible autonomic or cognitive features."
			},
			"epilepsy": {
				title: "Epilepsy",
				description: "Chronic condition characterized by recurrent unprovoked seizures.",
				causes: "Structural brain lesions, genetic factors, infections, metabolic disturbances, idiopathic.",
				symptoms: "Transient convulsions, sensory changes, brief loss of awareness or automatisms depending on focus."
			},
			"multiple-sclerosis": {
				title: "Multiple Sclerosis",
				description: "Immune-mediated demyelinating disease of the central nervous system with variable neurologic deficits.",
				causes: "Autoimmune demyelination with genetic and environmental contributors (e.g., low vitamin D, viral triggers).",
				symptoms: "Optic neuritis, limb weakness, sensory disturbances, balance problems, fatigue, relapsing-remitting course."
			},
			"migraine": {
				title: "Migraine",
				description: "Recurrent headache disorder often unilateral, pulsatile, associated with photophobia/phonophobia or aura.",
				causes: "Genetic predisposition, neural vascular mechanisms, triggers (stress, foods, hormonal changes).",
				symptoms: "Intense headache, nausea, vomiting, sensitivity to light/sound, sometimes visual aura."
			},
			"neuropathy": {
				title: "Neuropathy",
				description: "Peripheral nerve disorder causing sensory, motor or autonomic dysfunction.",
				causes: "Diabetes, toxins, infections, nutritional deficiencies, autoimmune conditions, inherited neuropathies.",
				symptoms: "Burning/tingling numbness, weakness, reduced reflexes, neuropathic pain."
			},
			"thyroid-disorders": {
				title: "Thyroid Disorders",
				description: "Conditions of thyroid dysfunction including hypothyroidism and hyperthyroidism.",
				causes: "Autoimmune (Hashimoto, Graves'), iodine deficiency/excess, thyroiditis, nodules, medications.",
				symptoms: "Hypothyroid: fatigue, weight gain, cold intolerance. Hyperthyroid: weight loss, heat intolerance, tremor."
			},
			"osteoporosis": {
				title: "Osteoporosis",
				description: "Reduced bone mass and microarchitectural deterioration leading to fracture risk.",
				causes: "Aging, estrogen deficiency, long-term steroids, immobilization, poor nutrition.",
				symptoms: "Often silent until fragility fracture; back pain, height loss from vertebral fractures."
			},
			"metabolic-syndrome": {
				title: "Metabolic Syndrome",
				description: "Cluster of conditions (central obesity, dyslipidemia, hypertension, hyperglycemia) increasing CV risk.",
				causes: "Insulin resistance, obesity, sedentary lifestyle, genetic predisposition.",
				symptoms: "Usually asymptomatic; associated findings include central obesity and abnormal labs."
			},
			"obesity": {
				title: "Obesity",
				description: "Excess body fat accumulation that presents health risks and increases risk of metabolic disease.",
				causes: "Caloric excess, sedentary lifestyle, genetic, endocrine disorders, certain medications.",
				symptoms: "Increased BMI, risk of diabetes, hypertension, sleep apnea, osteoarthritis; may have reduced exercise tolerance."
			},
			"gout": {
				title: "Gout",
				description: "Inflammatory arthritis due to monosodium urate crystal deposition associated with hyperuricemia.",
				causes: "Hyperuricemia from underexcretion or overproduction of uric acid; diuretics, diet, genetics.",
				symptoms: "Acute severe joint pain (classically first MTP), redness, swelling; tophi in chronic disease."
			},
			"hiv": {
				title: "HIV/AIDS",
				description: "Human immunodeficiency virus infection leading to progressive immune deficiency if untreated.",
				causes: "Transmission via blood, sexual contact, vertical transmission; viral replication causing CD4 decline.",
				symptoms: "Acute viral illness, followed by chronic infection; opportunistic infections and weight loss in advanced disease."
			},
			"hepatitis": {
				title: "Hepatitis",
				description: "Inflammation of the liver; may be viral (A,B,C), alcoholic, autoimmune or drug-induced.",
				causes: "Viral infections, alcohol, medications, autoimmune disorders.",
				symptoms: "Fatigue, jaundice, abdominal pain, anorexia, elevated liver enzymes; chronic disease may cause cirrhosis."
			},
			"dengue": {
				title: "Dengue Fever",
				description: "Mosquito-borne viral disease causing febrile illness; severe forms cause hemorrhage and shock.",
				causes: "Infection with dengue virus (Aedes mosquitoes).",
				symptoms: "High fever, severe myalgias/arthralgias, retro-orbital pain, rash, bleeding in severe cases."
			},
			"malaria": {
				title: "Malaria",
				description: "Parasitic infection transmitted by Anopheles mosquitoes causing cyclical fevers and systemic illness.",
				causes: "Plasmodium species infection (P. falciparum, P. vivax, etc.).",
				symptoms: "Fever, chills, sweats, headache, malaise; severe malaria may cause anemia, cerebral involvement."
			},
			"typhoid": {
				title: "Typhoid Fever",
				description: "Systemic infection caused by Salmonella Typhi characterized by prolonged fever and abdominal symptoms.",
				causes: "Ingestion of contaminated food/water with S. Typhi.",
				symptoms: "Prolonged fever, abdominal pain, constipation or diarrhea, hepatosplenomegaly."
			},
			"leptospirosis": {
				title: "Leptospirosis",
				description: "Zoonotic bacterial infection acquired from contaminated water or animal urine, can be severe.",
				causes: "Leptospira species exposure through contaminated water/soil or animal contact.",
				symptoms: "Fever, myalgia (calves), headache, conjunctival suffusion; severe: jaundice, renal failure, hemorrhage."
			},
			"gerd": {
				title: "Gastroesophageal Reflux Disease (GERD)",
				description: "Reflux of gastric contents causing troublesome symptoms or complications.",
				causes: "Lower esophageal sphincter dysfunction, hiatal hernia, obesity, certain foods/medications.",
				symptoms: "Heartburn, regurgitation, chest discomfort, chronic cough or laryngitis in some patients."
			},
			"peptic-ulcer": {
				title: "Peptic Ulcer Disease",
				description: "Ulceration of gastric or duodenal mucosa often caused by H. pylori or NSAIDs.",
				causes: "Helicobacter pylori infection, NSAID use, stress-related mucosal damage, smoking.",
				symptoms: "Epigastric pain (improved or worsened by food depending on location), nausea, bloating, possible bleeding."
			},
			"ibd": {
				title: "Inflammatory Bowel Disease (IBD)",
				description: "Chronic inflammatory conditions of the GI tract including Crohn's disease and ulcerative colitis.",
				causes: "Immune dysregulation with genetic and environmental contributors.",
				symptoms: "Abdominal pain, diarrhea (often bloody in UC), weight loss, urgency, extraintestinal manifestations."
			},
			"ibs": {
				title: "Irritable Bowel Syndrome (IBS)",
				description: "Functional GI disorder with abdominal pain related to defecation and altered bowel habits.",
				causes: "Multifactorial: gut-brain axis, post-infectious changes, motility and sensitivity alterations.",
				symptoms: "Recurrent abdominal pain, bloating, constipation or diarrhea predominant or mixed patterns."
			},
			"hepatitis-gi": {
				title: "Hepatitis (GI)",
				description: "Liver inflammation presenting in GI context; see hepatitis entry for details.",
				causes: "Viral hepatitis, alcohol, toxins, drugs.",
				symptoms: "Fatigue, anorexia, nausea, jaundice, abdominal discomfort."
			},
			"pancreatitis": {
				title: "Pancreatitis",
				description: "Inflammation of the pancreas ranging from mild to life-threatening.",
				causes: "Gallstones, alcohol, hypertriglyceridemia, medications, ERCP, trauma.",
				symptoms: "Severe epigastric pain radiating to back, nausea, vomiting, elevated pancreatic enzymes."
			}
		};

		function getDataFor(key){
			return diseaseData[key] || {
				title: key.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
				description: "Detailed description not available.",
				causes: "Causes not available.",
				symptoms: "Symptoms not available."
			};
		}

		// FIXED: ensure popup is rendered (hidden) before measuring its size
		function showPopupFor(key, anchorEl){
			const data = getDataFor(key);
			popupTitle.textContent = data.title;
			popupBody.innerHTML = "<strong>Description:</strong><div style='margin:6px 0 10px 0;'>"+escapeHtml(data.description)+"</div>"
								+ "<strong>Causes:</strong><div style='margin:6px 0 10px 0;'>"+escapeHtml(data.causes)+"</div>"
								+ "<strong>Symptoms:</strong><div style='margin:6px 0 0 0;'>"+escapeHtml(data.symptoms)+"</div>";

			// render popup off-screen / hidden so we can measure its real size
			popup.style.display = 'block';
			popup.style.visibility = 'hidden';
			popup.style.opacity = '0';
			popup.classList.add('show');

			// Position after it's rendered
			requestAnimationFrame(() => {
				const rect = anchorEl.getBoundingClientRect();
				const popupRect = popup.getBoundingClientRect();
				const margin = 8;
				let left = rect.left + window.scrollX;
				if (left + popupRect.width + margin > window.scrollX + window.innerWidth) {
					left = window.scrollX + window.innerWidth - popupRect.width - margin;
				}
				if (left < window.scrollX + margin) left = window.scrollX + margin;

				let top = rect.bottom + window.scrollY + 6;
				if (top + popupRect.height + margin > window.scrollY + window.innerHeight) {
					top = rect.top + window.scrollY - popupRect.height - 6;
					if (top < window.scrollY + margin) {
						top = window.scrollY + (window.innerHeight - popupRect.height)/2;
						left = window.scrollX + (window.innerWidth - popupRect.width)/2;
					}
				}

				popup.style.left = Math.round(left) + "px";
				popup.style.top = Math.round(top) + "px";

				// reveal popup smoothly
				popup.style.visibility = '';
				requestAnimationFrame(()=> popup.style.opacity = '1');
			});
		}

		function hidePopup(){
			if (!popup) return;
			popup.classList.remove('show');
			popup.style.opacity = '0';
			setTimeout(()=>{ if (popup.style.opacity === '0') popup.style.display = 'none'; }, 200);
		}

		function escapeHtml(str){
			return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
		}

		document.querySelectorAll('.disease-info').forEach(link=>{
			link.addEventListener('click', function(e){
				e.preventDefault();
				const key = this.getAttribute('data-disease') || '';
				showPopupFor(key, this);
			});
			link.addEventListener('dblclick', function(e){
				e.preventDefault();
				const key = this.getAttribute('data-disease') || '';
				showPopupFor(key, this);
			});
		});

		if (popupClose) popupClose.addEventListener('click', hidePopup);
		document.addEventListener('mousedown', function(e){
			if (!popup.contains(e.target) && !e.target.closest('.disease-info')) hidePopup();
		});
		document.addEventListener('keydown', function(e){ if (e.key === 'Escape') hidePopup(); });

	})();

});