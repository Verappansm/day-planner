import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: 'Waiting', color: 'bg-yellow-100 text-yellow-700' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-700' },
  finalized: { label: 'Finalized', color: 'bg-green-100 text-green-700' },
}

export default function RoomCard({ room, role }: { room: any; role: string }) {
  if (!room) return null
  const status = STATUS_LABELS[room.status] || STATUS_LABELS.waiting

  return (
    <Link href={`/room/${room.id}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
            🗺️
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">{room.name}</h3>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">
            {role === 'admin' ? 'Admin' : 'Member'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(room.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-[10px] text-gray-300 font-mono truncate">{room.id}</p>
        </div>
      </div>
    </Link>
  )
}
