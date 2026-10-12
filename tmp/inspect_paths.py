import re

with open('src/utils/mushafFrameSvgData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

styles = re.findall(r'style="([^"]+)"', text)
print('Total styled elements:', len(styles))

distinct_rules = set()
for s in styles:
    for rule in s.split(';'):
        rule = rule.strip()
        if rule:
            distinct_rules.add(rule)

print('Distinct style properties in mushafFrameSvgData.ts:')
for r in sorted(distinct_rules):
    print(' ', r)
