import { BackBar, Eyebrow, ListRow, Screen, Title } from '../ui'

const SECTIONS: [string, [string, string, string?][]][] = [
  ['Your week', [['Weekly routine', 'Mon–Fri · Work 9–5', '/onboarding/routine'], ['Off-day activities', 'Brunch, errands, going out, gym…', '/planner/off-day']]],
  ['Weather', [['Home city', 'Lawrence, KS', '/onboarding/city'], ['Temperature', '°F']]],
  ['Outfit rules', [['Don’t repeat a piece within', '4 days'], ['No repeats Mon–Fri', 'On']]],
  ['Account', [['Email', 'you@email.com'], ['Sign out', '', '/']]],
]

export function Settings() {
  return (
    <Screen tabs>
      <div className="flex flex-col gap-1">
        <BackBar label="Home" />
        <Title>Settings</Title>
        {SECTIONS.map(([sec, rows]) => (
          <div key={sec} className="pt-3">
            <Eyebrow className="text-[11px]">{sec}</Eyebrow>
            {rows.map(([t, d, to]) => <ListRow key={t} title={t} detail={d || undefined} to={to} />)}
          </div>
        ))}
      </div>
    </Screen>
  )
}
