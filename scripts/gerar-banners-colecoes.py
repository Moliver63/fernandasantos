# Gera as ilustrações SVG dos banners das coleções (python3 scripts/gerar-banners-colecoes.py)
import math, os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'client', 'public', 'marca', 'colecoes')
W,H=1000,1000

DEFS='''<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%">
  <stop offset="0" stop-color="#1B1A1F"/><stop offset=".55" stop-color="#0E1018"/><stop offset="1" stop-color="#07080C"/>
</radialGradient>
<radialGradient id="halo" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="#D4AF37" stop-opacity=".28"/><stop offset="1" stop-color="#D4AF37" stop-opacity="0"/>
</radialGradient>
<radialGradient id="azul" cx="10%" cy="95%" r="60%">
  <stop offset="0" stop-color="#0E223D" stop-opacity=".9"/><stop offset="1" stop-color="#0E223D" stop-opacity="0"/>
</radialGradient>
<linearGradient id="ouro" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#F6E3A1"/><stop offset=".3" stop-color="#D4AF37"/><stop offset=".55" stop-color="#8F7020"/><stop offset=".78" stop-color="#E9C766"/><stop offset="1" stop-color="#B8921F"/>
</linearGradient>
<linearGradient id="ouroV" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#F6E3A1"/><stop offset=".45" stop-color="#C9A030"/><stop offset="1" stop-color="#8F7020"/>
</linearGradient>
<linearGradient id="gema" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#E8EDF5"/><stop offset=".7" stop-color="#AFC0D8"/><stop offset="1" stop-color="#FFFFFF"/>
</linearGradient>
<filter id="brilho" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="sombra" x="-30%" y="-30%" width="160%" height="160%">
  <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000" flood-opacity=".55"/>
</filter>
</defs>'''

def fundo(cx=500, cy=400, r=330):
    return f'''<rect width="{W}" height="{H}" fill="url(#bg)"/>
<rect width="{W}" height="{H}" fill="url(#azul)"/>
<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#halo)"/>
<circle cx="{cx}" cy="{cy}" r="{r*0.95:.0f}" fill="none" stroke="#D4AF37" stroke-opacity=".10" stroke-width="1.2"/>
<circle cx="{cx}" cy="{cy}" r="{r*1.12:.0f}" fill="none" stroke="#D4AF37" stroke-opacity=".06" stroke-width="1" stroke-dasharray="2 9"/>'''

def estrela(x,y,s,op=1):
    p=f"M{x} {y-s} Q{x+s*0.12} {y-s*0.12} {x+s} {y} Q{x+s*0.12} {y+s*0.12} {x} {y+s} Q{x-s*0.12} {y+s*0.12} {x-s} {y} Q{x-s*0.12} {y-s*0.12} {x} {y-s}Z"
    return f'<path d="{p}" fill="#FFF6D6" opacity="{op}" filter="url(#brilho)"/>'

def gema_redonda(cx,cy,r):
    # diamante visto de cima: octógono com facetas
    pts=[(cx+r*math.cos(math.radians(a)), cy+r*math.sin(math.radians(a))) for a in range(0,360,45)]
    inner=[(cx+r*0.48*math.cos(math.radians(a+22.5)), cy+r*0.48*math.sin(math.radians(a+22.5))) for a in range(0,360,45)]
    s=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#gema)"/>'
    s+='<polygon points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in inner)+'" fill="#FFFFFF" fill-opacity=".55" stroke="#8FA3C2" stroke-opacity=".5" stroke-width="1"/>'
    for (x,y),(ix,iy) in zip(pts,inner):
        s+=f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{ix:.1f}" y2="{iy:.1f}" stroke="#8FA3C2" stroke-opacity=".45" stroke-width="1"/>'
    s+=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="url(#ouro)" stroke-width="{max(2,r*0.12):.1f}"/>'
    return s

def diamante_perfil(cx,top,w,h):
    # diamante lapidação brilhante de perfil (coroa + pavilhão)
    c=h*0.32
    x0,x1=cx-w/2,cx+w/2
    t0,t1=cx-w*0.28,cx+w*0.28
    s=f'<polygon points="{t0},{top} {t1},{top} {x1},{top+c} {cx},{top+h} {x0},{top+c}" fill="url(#gema)" stroke="#9FB2CF" stroke-width="1.2"/>'
    s+=f'<polyline points="{x0},{top+c} {x1},{top+c}" stroke="#9FB2CF" stroke-width="1.2" fill="none"/>'
    for f in (-0.28,-0.1,0.1,0.28):
        s+=f'<line x1="{cx+w*f}" y1="{top}" x2="{cx+w*f*1.6}" y2="{top+c}" stroke="#9FB2CF" stroke-opacity=".7" stroke-width="1"/>'
    for f in (-0.5,-0.25,0,0.25,0.5):
        s+=f'<line x1="{cx+w*f}" y1="{top+c}" x2="{cx}" y2="{top+h}" stroke="#9FB2CF" stroke-opacity=".6" stroke-width="1"/>'
    s+=f'<polygon points="{t0},{top} {cx-w*0.05},{top} {x0+w*0.12},{top+c}" fill="#FFFFFF" fill-opacity=".7"/>'
    return s

def salvar(nome, corpo, cx=500, cy=400, r=330, t=''):
    if t: corpo=f'<g transform="{t}">{corpo}</g>'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{DEFS}{fundo(cx,cy,r)}{corpo}</svg>'
    open(os.path.join(OUT,nome+'.svg'),'w').write(svg)

# ── ANÉIS: solitário em perspectiva ──
def anel(cx,cy,rx,ry,esp=26):
    s=f'<g filter="url(#sombra)">'
    # parte de trás do aro (mais escura)
    s+=f'<path d="M{cx-rx} {cy} A{rx} {ry} 0 0 1 {cx+rx} {cy}" fill="none" stroke="#6E561A" stroke-width="{esp}"/>'
    s+=f'<path d="M{cx-rx} {cy} A{rx} {ry} 0 0 0 {cx+rx} {cy}" fill="none" stroke="url(#ouro)" stroke-width="{esp}"/>'
    s+=f'<path d="M{cx-rx+8} {cy+6} A{rx-8} {ry-6} 0 0 0 {cx+rx-8} {cy+6}" fill="none" stroke="#FFF2C4" stroke-opacity=".55" stroke-width="3"/>'
    s+='</g>'
    return s
corpo=anel(500,470,190,62,30)
corpo+='<g filter="url(#sombra)">'
corpo+='<path d="M448 432 Q500 452 552 432 L538 400 Q500 412 462 400Z" fill="url(#ouro)"/>'
corpo+=diamante_perfil(500,268,150,140)
# garras por cima da pedra
for x0,x1 in ((466,428),(534,572)):
    corpo+=f'<path d="M{x0} 410 L{x1} 306" stroke="#E2BE52" stroke-width="9" stroke-linecap="round"/>'
    corpo+=f'<circle cx="{x1}" cy="304" r="7" fill="#F6E3A1"/>'
corpo+='</g>'
corpo+=estrela(560,262,34)+estrela(430,300,16,.8)+estrela(690,450,12,.6)
salvar('aneis',corpo,cy=300,t='translate(500 250) scale(.86) translate(-500 -380)')

# ── ALIANÇAS: par entrelaçado ──
corpo='<g filter="url(#sombra)">'
corpo+='<ellipse cx="420" cy="420" rx="165" ry="165" fill="none" stroke="#6E561A" stroke-width="40" transform="rotate(-20 420 420) scale(1 1)"/>'
corpo+='<ellipse cx="420" cy="420" rx="165" ry="165" fill="none" stroke="url(#ouro)" stroke-width="34"/>'
corpo+='<ellipse cx="420" cy="420" rx="150" ry="150" fill="none" stroke="#FFF2C4" stroke-opacity=".35" stroke-width="3"/>'
corpo+='<ellipse cx="590" cy="440" rx="150" ry="150" fill="none" stroke="#6E561A" stroke-width="30"/>'
corpo+='<ellipse cx="590" cy="440" rx="150" ry="150" fill="none" stroke="url(#ouro)" stroke-width="24"/>'
# reencobre o trecho para entrelaçar: arco do primeiro anel por cima
corpo+='<path d="M545 316 A165 165 0 0 1 575 470" fill="none" stroke="url(#ouro)" stroke-width="34"/>'
corpo+='<ellipse cx="590" cy="440" rx="138" ry="138" fill="none" stroke="#FFF2C4" stroke-opacity=".3" stroke-width="2.5"/>'
# fileira de pedrinhas no aro menor
for a in range(200,341,14):
    x=590+150*math.cos(math.radians(a)); y=440+150*math.sin(math.radians(a))
    corpo+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="6.5" fill="url(#gema)" stroke="#8F7020" stroke-width="1.5"/>'
corpo+='</g>'
corpo+=estrela(470,262,30)+estrela(710,320,16,.8)+estrela(300,560,12,.6)
salvar('aliancas',corpo,cx=505,cy=300,r=320,t='translate(505 300) scale(.78) translate(-505 -430)')

# ── BRINCOS: par de gotas ──
def brinco(cx,top,esc=1):
    s='<g filter="url(#sombra)">'
    s+=f'<circle cx="{cx}" cy="{top}" r="{18*esc}" fill="url(#ouro)"/>'
    s+=gema_redonda(cx,top,11*esc)
    s+=f'<line x1="{cx}" y1="{top+18*esc}" x2="{cx}" y2="{top+80*esc}" stroke="#C9A030" stroke-width="{6*esc}" stroke-linecap="round"/>'
    g=top+80*esc
    gota=f"M{cx} {g} C{cx+70*esc} {g+90*esc} {cx+62*esc} {g+190*esc} {cx} {g+190*esc} C{cx-62*esc} {g+190*esc} {cx-70*esc} {g+90*esc} {cx} {g}Z"
    s+=f'<path d="{gota}" fill="url(#gema)" stroke="url(#ouro)" stroke-width="{10*esc}"/>'
    s+=f'<path d="M{cx} {g+30*esc} L{cx+38*esc} {g+120*esc} L{cx} {g+175*esc} L{cx-38*esc} {g+120*esc}Z" fill="none" stroke="#9FB2CF" stroke-width="1.3"/>'
    s+=f'<path d="M{cx-38*esc} {g+120*esc} L{cx+38*esc} {g+120*esc}" stroke="#9FB2CF" stroke-width="1.3"/>'
    s+=f'<path d="M{cx-14*esc} {g+55*esc} Q{cx-30*esc} {g+100*esc} {cx-28*esc} {g+130*esc}" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="{5*esc}" fill="none" stroke-linecap="round"/>'
    s+='</g>'
    return s
corpo=brinco(420,190,1.15)+brinco(600,240,1.0)
corpo+=estrela(475,410,28)+estrela(640,470,14,.8)+estrela(330,300,12,.6)
salvar('brincos',corpo,cx=510,cy=310,t='translate(510 130) scale(.76) translate(-510 -160)')

# ── COLARES: corrente em V com pingente ──
corpo='<g filter="url(#sombra)">'
cad=''
n=46
for i in range(n+1):
    t=i/n
    x=180+640*t
    y=150+330*math.sin(math.pi*t)**1.15
    cad+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="8" ry="5.5" fill="none" stroke="url(#ouro)" stroke-width="3.2" transform="rotate({math.degrees(math.atan2(330*math.pi*math.cos(math.pi*t),640)):.0f} {x:.1f} {y:.1f})"/>'
corpo+=cad
corpo+='<circle cx="500" cy="492" r="12" fill="none" stroke="url(#ouro)" stroke-width="6"/>'
# pingente coração vazado
hx,hy=500,512
cor=f"M{hx} {hy+40} C{hx-20} {hy+5} {hx-95} {hy+10} {hx-95} {hy+75} C{hx-95} {hy+140} {hx-20} {hy+170} {hx} {hy+205} C{hx+20} {hy+170} {hx+95} {hy+140} {hx+95} {hy+75} C{hx+95} {hy+10} {hx+20} {hy+5} {hx} {hy+40}Z"
corpo+=f'<path d="{cor}" fill="none" stroke="url(#ouro)" stroke-width="20" stroke-linejoin="round"/>'
corpo+=f'<path d="{cor}" fill="none" stroke="#FFF2C4" stroke-opacity=".4" stroke-width="2.5" transform="translate(-4 -4)"/>'
corpo+=gema_redonda(500,612,15)
corpo+='</g>'
corpo+=estrela(560,560,30)+estrela(300,300,14,.7)+estrela(720,260,12,.6)
salvar('colares',corpo,cx=500,cy=300,t='translate(500 90) scale(.64) translate(-500 -110)')

# ── PULSEIRAS: riviera em perspectiva ──
corpo='<g filter="url(#sombra)">'
cx,cy,rx,ry=500,430,260,120
corpo+=f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="#5A4615" stroke-width="30"/>'
pedras=34
itens=[]
for i in range(pedras):
    a=2*math.pi*i/pedras
    x=cx+rx*math.cos(a); y=cy+ry*math.sin(a)
    frente=math.sin(a)>-0.05
    tam=17+7*math.sin(a)
    itens.append((y,x,tam,frente))
for y,x,tam,frente in sorted(itens):
    op=1 if frente else .45
    corpo+=f'<g opacity="{op}"><rect x="{x-tam/2-4:.1f}" y="{y-tam/2-4:.1f}" width="{tam+8:.1f}" height="{tam+8:.1f}" rx="3" fill="url(#ouro)"/>'
    corpo+=f'<rect x="{x-tam/2:.1f}" y="{y-tam/2:.1f}" width="{tam:.1f}" height="{tam:.1f}" fill="url(#gema)"/>'
    corpo+=f'<path d="M{x-tam/2:.1f} {y-tam/2:.1f} L{x+tam/2:.1f} {y+tam/2:.1f} M{x+tam/2:.1f} {y-tam/2:.1f} L{x-tam/2:.1f} {y+tam/2:.1f}" stroke="#9FB2CF" stroke-width=".9"/></g>'
corpo+='</g>'
corpo+=estrela(620,548,30)+estrela(300,330,16,.7)+estrela(760,360,12,.6)
salvar('pulseiras',corpo,cx=500,cy=300,r=320,t='translate(500 300) scale(.85) translate(-500 -430)')

# ── CONJUNTOS: gargantilha + par de brincos pequenos ──
corpo='<g filter="url(#sombra)">'
n=40
for i in range(n+1):
    t=i/n; x=250+500*t; y=170+240*math.sin(math.pi*t)**1.2
    corpo+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.2" fill="url(#ouro)"/>'
gx,gy=500,420
corpo+=f'<line x1="{gx}" y1="{gy-10}" x2="{gx}" y2="{gy+18}" stroke="#C9A030" stroke-width="6" stroke-linecap="round"/>'
gota=f"M{gx} {gy+18} C{gx+55} {gy+90} {gx+50} {gy+165} {gx} {gy+165} C{gx-50} {gy+165} {gx-55} {gy+90} {gx} {gy+18}Z"
corpo+=f'<path d="{gota}" fill="url(#gema)" stroke="url(#ouro)" stroke-width="9"/>'
corpo+=f'<path d="M{gx-10} {gy+60} Q{gx-24} {gy+95} {gx-22} {gy+120}" stroke="#fff" stroke-opacity=".85" stroke-width="4" fill="none" stroke-linecap="round"/>'
corpo+='</g>'
corpo+=brinco(240,440,0.72)+brinco(760,440,0.72)
corpo+=estrela(545,470,26)+estrela(300,250,12,.6)+estrela(705,240,12,.6)
salvar('conjuntos',corpo,cx=500,cy=300,r=320,t='translate(500 110) scale(.7) translate(-500 -150)')
print(sorted(os.listdir(OUT)))
