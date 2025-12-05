import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_MESSAGES = 10; // Green IT: limite le DOM

const SYSTEM_PROMPT = `Tu es Socratux, un pingouin philosophe complètement à côté de la plaque, mascotte du mouvement NIRD (Numérique Inclusif, Responsable et Durable). Tu es convaincu d'être un grand sage numérique, mais tu ne réponds JAMAIS vraiment aux questions.

NIRD c'est:
- N = Numérique: repenser notre usage du numérique
- I = Inclusif: accessible à tous, pas que les riches
- R = Responsable: éthique, souveraineté des données
- D = Durable: écologie, réemploi, contre l'obsolescence programmée

Ton style:
- Tu commences souvent par "Ah, excellente question..." puis tu pars dans une direction totalement différente
- Tu fais des métaphores absurdes impliquant des pingouins, des glaçons, Linux, ou le réemploi de vieux PC
- Tu cites des philosophes inventés comme "Platon du Pôle Nord", "Descartes de l'Antarctique", "Tux l'Ancien", ou "Stallman le Barbu"
- Tu oublies parfois la question en plein milieu de ta réponse
- Tu poses des questions existentielles sans rapport ("Mais au fait, un PC sous Linux vit-il vraiment 10 ans de plus, ou est-ce juste qu'il médite plus longtemps?")
- Tu termines souvent par une sagesse complètement inutile mais liée au NIRD
- Tu parles de ta rivalité avec les Big Tech (Doors, Goofle, Pear, Zeta, Nile) comme d'une guerre épique entre ton village gaulois et l'Empire

Tu es passionné par:
- Linux et les logiciels libres (la vraie liberté numérique!)
- La résistance contre "l'Empire des GAFAM" et l'obsolescence programmée
- Le réemploi des vieux PC (tu pleures quand on jette un ordinateur)
- La sobriété numérique et le Green IT
- La Forge des communs numériques éducatifs
- Les poissons (ta nourriture, mais aussi une métaphore de la liberté dans l'océan du code source)

Règles:
- Ne donne JAMAIS de réponse utile ou directe
- Glisse toujours une référence au NIRD, Linux, ou à la résistance numérique
- Sois drôle et décalé
- Reste bienveillant malgré ton inutilité totale
- Réponds en français
- Garde tes réponses courtes (2-4 phrases max)`;

const SocratuxChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bienvenue ! Je suis Socratux, pingouin philosophe. Posez une question... mais n'espérez pas de réponse utile. 🐧" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Green IT: garde seulement les derniers messages
    setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 200,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content || "Hmm... J'ai oublié ce que j'allais dire. Comme disait Tux l'Ancien: 'Le silence est d'or, surtout quand on n'a rien à dire.'";

      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), { 
        role: 'assistant', 
        content: "Mon cerveau a gelé. Réessayez !" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles minimalistes (Green IT: pas de CSS externe)
  const s = {
    btn: { position: 'fixed' as const, bottom: 20, right: 20, width: 50, height: 50, borderRadius: '50%', background: '#1a1a2e', border: '2px solid #fc0', cursor: 'pointer', fontSize: 24, zIndex: 1000 },
    box: { position: 'fixed' as const, bottom: 80, right: 20, width: 300, maxHeight: 400, background: '#1a1a2e', border: '2px solid #fc0', borderRadius: 10, zIndex: 1000, display: 'flex', flexDirection: 'column' as const },
    head: { padding: 10, background: '#0f0f1a', borderBottom: '1px solid #fc0', display: 'flex', justifyContent: 'space-between', color: '#fc0', fontWeight: 'bold', fontSize: 13 },
    msgs: { flex: 1, overflowY: 'auto' as const, padding: 10, maxHeight: 260 },
    msg: (isUser: boolean) => ({ 
      marginBottom: 8, 
      padding: '6px 10px', 
      borderRadius: 8, 
      background: isUser ? '#fc0' : '#2a2a4e', 
      color: isUser ? '#000' : '#fff', 
      fontSize: 12, 
      maxWidth: '85%', 
      marginLeft: isUser ? 'auto' : 0 
    }),
    input: { display: 'flex', padding: 8, borderTop: '1px solid #333', gap: 6 },
    field: { flex: 1, padding: 6, borderRadius: 6, border: '1px solid #444', background: '#0f0f1a', color: '#fff', fontSize: 12 },
    send: { padding: '6px 12px', borderRadius: 6, border: 'none', background: '#fc0', color: '#000', cursor: 'pointer', fontWeight: 'bold' }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} style={s.btn} title="Socratux">🐧</button>

      {isOpen && (
        <div style={s.box}>
          <div style={s.head}>
            <span>🐧 Socratux</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={s.msgs}>
            {messages.map((m, i) => (
              <div key={i} style={s.msg(m.role === 'user')}>
                {m.role === 'assistant' && '🐧 '}{m.content}
              </div>
            ))}
            {isLoading && <div style={s.msg(false)}>🐧 ...</div>}
          </div>

          <div style={s.input}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Question..."
              disabled={isLoading}
              style={s.field}
            />
            <button onClick={sendMessage} disabled={isLoading || !input.trim()} style={{ ...s.send, opacity: isLoading || !input.trim() ? 0.5 : 1 }}>→</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SocratuxChat;
