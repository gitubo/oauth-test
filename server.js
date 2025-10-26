// Importa Express e body-parser
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware per analizzare i dati URL encoded (necessario per i form HTML)
app.use(bodyParser.urlencoded({ extended: true }));

// =========================================================================
// ROUTE PRINCIPALE: /
// Espone il modulo per l'inserimento delle credenziali e l'avvio dell'OAuth
// =========================================================================
app.get('/', (req, res) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OAuth 2.0 Test Client</title>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f4f7f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .container { background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); width: 100%; max-width: 500px; }
                h1 { color: #333; margin-bottom: 30px; text-align: center; }
                label { display: block; margin-bottom: 8px; font-weight: bold; color: #555; }
                input[type="text"] { width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; transition: border-color 0.3s; }
                input[type="text"]:focus { border-color: #007bff; outline: none; }
                .button-primary {
                    width: 100%;
                    padding: 14px;
                    background-color: #28a745;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s, transform 0.1s;
                }
                .button-primary:hover {
                    background-color: #218838;
                }
                .button-primary:active {
                    transform: translateY(1px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>OAuth 2.0 Test Client</h1>
                <p style="text-align: center; color: #777;">Inserisci i dettagli di configurazione dell'app GitHub/OAuth.</p>
                <form id="oauthForm">
                    <label for="client_id">Client ID (ID)</label>
                    <input type="text" id="client_id" name="client_id" placeholder="es. abcdef1234567890">

                    <label for="client_secret">Client Secret (Secret)</label>
                    <input type="text" id="client_secret" name="client_secret" placeholder="Non necessario per l'inizio del flusso">

                    <label for="auth_url">Service Authorization URL (Servizio)</label>
                    <input type="text" id="auth_url" name="auth_url" placeholder="es. https://github.com/login/oauth/authorize" value="https://github.com/login/oauth/authorize">
                    
                    <label for="callback_url">Callback Redirect URI (Callback)</label>
                    <input type="text" id="callback_url" name="callback_url" placeholder="L'URL pubblico della tua app + /callback">
                    
                    <button type="submit" class="button-primary">Avvia Flusso di Autorizzazione OAuth</button>
                </form>
            </div>

            <script>
                document.getElementById('oauthForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const clientId = document.getElementById('client_id').value;
                    const authUrl = document.getElementById('auth_url').value;
                    const callbackUrl = document.getElementById('callback_url').value;
                    
                    if (!clientId || !authUrl || !callbackUrl) {
                        alert('Si prega di compilare Client ID, Service URL e Callback URL.');
                        return;
                    }

                    // Costruisce l'URL di reindirizzamento OAuth 2.0
                    // Il 'state' è raccomandato per la sicurezza (prevenzione CSRF)
                    const state = Math.random().toString(36).substring(2, 15);
                    
                    const redirectUri = new URL(authUrl);
                    redirectUri.searchParams.append('client_id', clientId);
                    redirectUri.searchParams.append('redirect_uri', callbackUrl);
                    redirectUri.searchParams.append('scope', 'user'); // Esempio per GitHub
                    redirectUri.searchParams.append('state', state);

                    // Reindirizza l'utente al Service Provider (GitHub, ecc.)
                    window.location.href = redirectUri.toString();
                });
            </script>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

// =========================================================================
// ROUTE DI CALLBACK: /callback
// Riceve la risposta dal provider OAuth (GitHub)
// =========================================================================
// ATTENZIONE: Il flusso OAuth standard utilizza GET per il callback, non POST.
app.get('/callback', (req, res) => {
    // Il provider OAuth invia il codice di autorizzazione e lo stato come parametri di query
    const code = req.query.code;
    const state = req.query.state;
    const error = req.query.error;

    let responseContent;

    if (error) {
        // Gestione degli errori (es. l'utente ha negato l'autorizzazione)
        responseContent = `
            <p style="color: red; font-weight: bold;">ERRORE DI AUTORIZZAZIONE</p>
            <p><strong>Tipo di Errore:</strong> ${error}</p>
            <p><strong>Descrizione:</strong> ${req.query.error_description || 'Nessuna descrizione fornita.'}</p>
        `;
    } else if (code) {
        // Autenticazione riuscita, mostriamo il codice
        responseContent = `
            <p style="color: green; font-weight: bold;">AUTENTICAZIONE RIUSCITA</p>
            <p>Questo <strong>CODICE DI AUTORIZZAZIONE (KEY)</strong> è ciò di cui hai bisogno per lo scambio finale.</p>
            <div style="background: #e9e9e9; padding: 15px; border-radius: 6px; word-break: break-all; margin-top: 15px;">
                <code>${code}</code>
            </div>
            <p style="margin-top: 20px;">
                (In un'applicazione reale, il server userebbe questo codice + Client Secret per ottenere l'Access Token.)
            </p>
        `;
    } else {
        // Nessun codice o errore ricevuto
        responseContent = `<p style="color: orange;">Nessun codice di autorizzazione ricevuto. Controlla la configurazione di GitHub e la Callback URI.</p>`;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OAuth Callback Result</title>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f4f7f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .container { background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); width: 100%; max-width: 600px; }
                h1 { color: #333; margin-bottom: 20px; text-align: center; }
                p { line-height: 1.6; }
                code { font-size: 1.1em; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Risultato del Callback OAuth</h1>
                ${responseContent}
                <a href="/" style="display: block; text-align: center; margin-top: 30px; color: #007bff;">Torna al modulo iniziale</a>
            </div>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server Express in ascolto sulla porta ${PORT}`);
    console.log(`Apri http://localhost:${PORT} nel tuo browser.`);
});
