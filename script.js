// Server Configuration
const SERVER_CONFIG = {
    cfxServerID: 'bjj7mb', // CFX.re server ID
    discordInvite: 'https://discord.gg/wavepvp', // Discord invite link
    discordInviteCode: 'wavepvp', // Kun invite koden (efter discord.gg/)
    restartTimes: [0, 6, 12, 18], // Restart tidspunkter (timer i 24-timers format)
};

// DOM Elements
const elements = {
    playerCount: document.getElementById('player-count'),
    discordCount: document.getElementById('discord-count'),
    nextRestart: document.getElementById('uptime'),
    connectCode: document.getElementById('connect-code'),
    discordLink: document.getElementById('discord-link'),
    serverStatusText: document.getElementById('server-status-text'),
};

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
    loadServerStats();
    updateNextRestart();
    
    // Refresh stats every 30 seconds
    setInterval(loadServerStats, 30000);
    
    // Update restart countdown every second
    setInterval(updateNextRestart, 1000);
});

function initializeWebsite() {
    // Connect code sættes når vi henter server data
    elements.connectCode.textContent = 'Indlæser...';
    
    // Set up Discord link
    elements.discordLink.href = SERVER_CONFIG.discordInvite;
    
    // Add loading states
    if (elements.playerCount) elements.playerCount.classList.add('loading');
    if (elements.discordCount) elements.discordCount.classList.add('loading');
}

async function loadServerStats() {
    await Promise.all([
        loadPlayerCount(),
        loadDiscordMembers()
    ]);
}

async function loadPlayerCount() {
    if (!elements.playerCount) return;
    
    try {
        const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${SERVER_CONFIG.cfxServerID}`);
        const data = await response.json();
        
        if (data && data.Data) {
            const current = data.Data.clients || 0;
            const max = data.Data.sv_maxclients || data.Data.svMaxclients || 48;
            elements.playerCount.textContent = `${current}/${max}`;
            elements.playerCount.classList.remove('loading');
            
            // Opdater hero status tekst
            if (elements.serverStatusText) {
                elements.serverStatusText.textContent = `${current} Players Online`;
            }
            
            // Opdater connect code med server endpoint
            if (data.EndPoint) {
                elements.connectCode.textContent = `connect ${data.EndPoint}`;
            } else {
                elements.connectCode.textContent = `connect cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
            }
            return;
        }
        
        // Fallback
        elements.playerCount.textContent = '0/48';
        elements.connectCode.textContent = `connect cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
        elements.playerCount.classList.remove('loading');
        
        // Opdater hero status
        if (elements.serverStatusText) {
            elements.serverStatusText.textContent = '0 Players Online';
        }
        
    } catch (error) {
        console.error('Fejl ved indlæsning af spillerantal:', error);
        elements.playerCount.textContent = 'Offline';
        elements.connectCode.textContent = `connect cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
        elements.playerCount.classList.remove('loading');
        
        // Opdater hero status ved fejl
        if (elements.serverStatusText) {
            elements.serverStatusText.textContent = 'Server Offline';
        }
    }
}

async function loadDiscordMembers() {
    if (!elements.discordCount) return;
    
    try {
        // Brug Discord invite API til at få member count
        if (SERVER_CONFIG.discordInviteCode) {
            const response = await fetch(`https://discord.com/api/invites/${SERVER_CONFIG.discordInviteCode}?with_counts=true`);
            
            if (!response.ok) {
                throw new Error('Invite API fejlede');
            }
            
            const data = await response.json();
            
            // Invite API giver approximate_member_count (totalt antal medlemmer)
            if (data && data.approximate_member_count) {
                elements.discordCount.textContent = data.approximate_member_count.toLocaleString();
                elements.discordCount.classList.remove('loading');
                return;
            }
        }
        
        // Fallback - vis placeholder
        elements.discordCount.textContent = '-';
        elements.discordCount.classList.remove('loading');
        
    } catch (error) {
        console.error('Fejl ved indlæsning af Discord medlemmer:', error);
        elements.discordCount.textContent = '-';
        elements.discordCount.classList.remove('loading');
    }
}

// Calculate and display next restart time
function updateNextRestart() {
    if (!elements.nextRestart) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    // Find næste restart tidspunkt
    let nextRestartHour = SERVER_CONFIG.restartTimes.find(hour => hour > currentHour);
    
    // Hvis ingen restart er tilbage i dag, tag den første i morgen
    if (nextRestartHour === undefined) {
        nextRestartHour = SERVER_CONFIG.restartTimes[0];
    }
    
    // Beregn tid til næste restart
    let hoursUntil, minutesUntil, secondsUntil;
    
    if (nextRestartHour > currentHour) {
        // Restart er senere i dag
        hoursUntil = nextRestartHour - currentHour - 1;
        minutesUntil = 59 - currentMinutes;
        secondsUntil = 59 - currentSeconds;
        
        if (currentMinutes === 0 && currentSeconds === 0) {
            hoursUntil = nextRestartHour - currentHour;
            minutesUntil = 0;
            secondsUntil = 0;
        }
    } else {
        // Restart er i morgen
        hoursUntil = (24 - currentHour) + nextRestartHour - 1;
        minutesUntil = 59 - currentMinutes;
        secondsUntil = 59 - currentSeconds;
        
        if (currentMinutes === 0 && currentSeconds === 0) {
            hoursUntil = (24 - currentHour) + nextRestartHour;
            minutesUntil = 0;
            secondsUntil = 0;
        }
    }
    
    // Formater output
    const hours = hoursUntil.toString().padStart(2, '0');
    const minutes = minutesUntil.toString().padStart(2, '0');
    const seconds = secondsUntil.toString().padStart(2, '0');
    
    elements.nextRestart.textContent = `${hours}:${minutes}:${seconds}`;
}

function copyConnectCode() {
    const connectText = elements.connectCode.textContent;
    
    navigator.clipboard.writeText(connectText).then(function() {
        // Vis success feedback
        const copyButton = document.querySelector('.copy-button');
        const originalHTML = copyButton.innerHTML;
        
        copyButton.innerHTML = '<i class="fas fa-check"></i>';
        copyButton.style.background = '#4ade80';
        
        setTimeout(function() {
            copyButton.innerHTML = originalHTML;
            copyButton.style.background = '';
        }, 2000);
        
    }).catch(function(err) {
        console.error('Kunne ikke kopiere tekst:', err);
        
        // Fallback: Vælg tekst for manuel kopiering
        const codeElement = elements.connectCode;
        const range = document.createRange();
        range.selectNode(codeElement);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        alert('Connect koden er markeret! Tryk Ctrl+C for at kopiere.');
    });
}

function connectToServer() {
    // Brug cfx.re link til direkte connect
    const fivemLink = `fivem://connect/cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
    
    // Forsøg at åbne FiveM direkte
    window.location.href = fivemLink;
    
    // Vis fallback instruktioner efter kort forsinkelse
    setTimeout(function() {
        const connectCode = elements.connectCode.textContent;
        if (confirm('Hvis FiveM ikke åbnede automatisk, skal du kopiere denne kode og indsætte den i FiveM konsollen (F8):\n\n' + connectCode + '\n\nVil du kopiere koden nu?')) {
            copyConnectCode();
        }
    }, 2000);
}

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe stat boxes for animation
document.addEventListener('DOMContentLoaded', function() {
    const statBoxes = document.querySelectorAll('.stat-box');
    statBoxes.forEach(box => {
        box.style.opacity = '0';
        box.style.transform = 'translateY(20px)';
        box.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(box);
    });
});