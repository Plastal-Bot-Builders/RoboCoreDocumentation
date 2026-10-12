import re,sys
def extract(text,name):
    """Return the full (symbol "name" ...) block from a .kicad_sym or lib_symbols section."""
    key=f'(symbol "{name}"'
    i=text.find(key)
    if i<0: return None
    depth=0;j=i
    while True:
        c=text[j]
        if c=='"':
            j+=1
            while text[j]!='"':
                if text[j]=='\\': j+=1
                j+=1
        elif c=='(': depth+=1
        elif c==')':
            depth-=1
            if depth==0: return text[i:j+1]
        j+=1
def pins(block):
    out=[]
    for m in re.finditer(r'\(pin (\w+) (\w+)\s*\(at ([\-\d\.]+) ([\-\d\.]+) (\d+)\)\s*\(length ([\d\.]+)\)(.*?)\(name "([^"]*)".*?\(number "([^"]+)"',block,flags=re.S):
        out.append(dict(etype=m.group(1),x=float(m.group(3)),y=float(m.group(4)),rot=int(m.group(5)),len=float(m.group(6)),name=m.group(8),num=m.group(9),hidden='(hide yes)' in m.group(7) or ' hide' in m.group(7)))
    return out
def props(block):
    return dict(re.findall(r'\(property "([^"]+)" "([^"]*)"',block))
