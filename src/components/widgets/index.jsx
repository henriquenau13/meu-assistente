import TodayWidget from './TodayWidget'
import MusicWidget from './MusicWidget'
import ScreenWidget from './ScreenWidget'
import ConnectionsWidget from './ConnectionsWidget'
import ShortcutsWidget from './ShortcutsWidget'
import SystemWidget from './SystemWidget'
import './widgets.css'

export const WIDGETS = [
  { id: 'today', title: 'Hoje', icon: 'today', height: 156, Component: TodayWidget },
  { id: 'music', title: 'Música', icon: 'music', height: 150, Component: MusicWidget },
  { id: 'screen', title: 'Tela', icon: 'sun', height: 116, Component: ScreenWidget },
  { id: 'connections', title: 'Conexões', icon: 'wifi', height: 92, Component: ConnectionsWidget },
  { id: 'shortcuts', title: 'Atalhos', icon: 'grid', height: 84, Component: ShortcutsWidget },
  { id: 'system', title: 'Sistema', icon: 'cpu', height: 104, Component: SystemWidget },
]