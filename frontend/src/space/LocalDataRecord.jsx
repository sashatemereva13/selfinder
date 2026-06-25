import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ROOM_KEYS,
  LOCAL_CONSENT_KEY,
  readAllRooms,
  readMeasureResult,
  deleteVisitFromRoom,
  clearRoomFromStorage,
  clearAllLocalData,
} from "../hooks/useRoomProgress";

const ROOM_LABELS = {
  persona: "The Persona",
  self:    "The Self",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ChipList({ items }) {
  if (!items?.length) return <span className="ldr-empty-value">none</span>;
  return (
    <span className="ldr-chip-inline">
      {items.join(", ")}
    </span>
  );
}

function MechanicData({ roomKey, mechanic }) {
  if (!mechanic) return <p className="ldr-muted">Mechanic not completed.</p>;

  const rows = [];

  if (roomKey === "persona") {
    rows.push(["Shown to the world", <ChipList items={mechanic.publicFace} />]);
    rows.push(["Known only to self", <ChipList items={mechanic.privateFace} />]);
    rows.push(["Shown but not fully felt", <ChipList items={mechanic.onlyPublic} />]);
    rows.push(["Felt but not shown", <ChipList items={mechanic.onlyPrivate} />]);
    rows.push(["Present in both", <ChipList items={mechanic.inBoth} />]);
  } else if (roomKey === "self") {
    if (mechanic.roomsVisited?.length) {
      rows.push(["Rooms visited", mechanic.roomsVisited.join(", ")]);
    }
    mechanic.priorArtefacts?.forEach(({ room, text }) => {
      rows.push([room, `"${text}"`]);
    });
  }

  if (!rows.length) return <p className="ldr-muted">No mechanic data recorded.</p>;

  return (
    <table className="ldr-mechanic-table">
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i} className="ldr-mechanic-row">
            <td className="ldr-mechanic-label">{label}</td>
            <td className="ldr-mechanic-value">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChatTranscript({ messages }) {
  if (!messages?.length) return <p className="ldr-muted">No conversation recorded.</p>;
  return (
    <div className="ldr-transcript">
      {messages.map((m, i) => (
        <div key={i} className={`ldr-transcript-msg ldr-transcript-msg--${m.role}`}>
          <span className="ldr-transcript-role">{m.role === "user" ? "You" : "Companion"}</span>
          <p className="ldr-transcript-content">{m.content}</p>
        </div>
      ))}
    </div>
  );
}

function VisitRow({ roomKey, visit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="ldr-visit">
      <div className="ldr-visit-head">
        <div className="ldr-visit-meta">
          <span className="ldr-visit-date">{fmtDate(visit.date)}</span>
          {visit.completedAt ? (
            <span className="ldr-visit-status ldr-visit-status--done">Completed</span>
          ) : (
            <span className="ldr-visit-status ldr-visit-status--open">In progress</span>
          )}
        </div>
        <div className="ldr-visit-actions">
          <button
            type="button"
            className="ldr-icon-btn"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand all data"}
          >
            {expanded ? "↑" : "↓"}
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              className="ldr-icon-btn ldr-icon-btn--danger"
              onClick={() => setConfirmDelete(true)}
              title="Delete this visit"
            >
              ×
            </button>
          ) : (
            <span className="ldr-confirm-delete">
              Delete this visit?{" "}
              <button type="button" className="ldr-confirm-yes" onClick={() => onDelete(visit.id)}>
                Yes
              </button>
              <button type="button" className="ldr-confirm-no" onClick={() => setConfirmDelete(false)}>
                No
              </button>
            </span>
          )}
        </div>
      </div>

      {visit.unlock && (
        <blockquote className="ldr-unlock">"{visit.unlock}"</blockquote>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="ldr-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="ldr-expanded-section">
              <p className="ldr-expanded-label">Mechanic data</p>
              <MechanicData roomKey={roomKey} mechanic={visit.mechanic} />
            </div>
            <div className="ldr-expanded-section">
              <p className="ldr-expanded-label">Conversation ({visit.messages?.length ?? 0} messages)</p>
              <ChatTranscript messages={visit.messages} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomCard({ roomKey, roomData, onRefresh }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const visits = roomData?.visits ?? [];

  function handleDeleteVisit(visitId) {
    deleteVisitFromRoom(roomKey, visitId);
    onRefresh();
  }

  function handleClearRoom() {
    clearRoomFromStorage(roomKey);
    setConfirmClear(false);
    onRefresh();
  }

  return (
    <div className="ldr-room-card">
      <div className="ldr-room-head">
        <span className="ldr-room-label">{ROOM_LABELS[roomKey]}</span>
        {visits.length > 0 && (
          confirmClear ? (
            <span className="ldr-confirm-delete">
              Clear all visits?{" "}
              <button type="button" className="ldr-confirm-yes" onClick={handleClearRoom}>Yes</button>
              <button type="button" className="ldr-confirm-no" onClick={() => setConfirmClear(false)}>No</button>
            </span>
          ) : (
            <button
              type="button"
              className="ldr-clear-room-btn"
              onClick={() => setConfirmClear(true)}
            >
              Clear room
            </button>
          )
        )}
      </div>

      {visits.length === 0 ? (
        <p className="ldr-no-visits">No visits yet.</p>
      ) : (
        <div className="ldr-visits">
          {[...visits].reverse().map((visit) => (
            <VisitRow
              key={visit.id}
              roomKey={roomKey}
              visit={visit}
              onDelete={handleDeleteVisit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocalDataRecord() {
  const [tick, setTick] = useState(0);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  function refresh() { setTick((t) => t + 1); }

  // Read fresh from localStorage each render
  const allRooms = readAllRooms();
  const measureResult = readMeasureResult();
  const consentRaw = localStorage.getItem(LOCAL_CONSENT_KEY);
  const firstSaved = consentRaw ? JSON.parse(consentRaw).timestamp : null;

  const hasAnyRoomData = ROOM_KEYS.some((k) => (allRooms[k]?.visits?.length ?? 0) > 0);
  const hasAnyData = hasAnyRoomData || !!measureResult;

  function handleClearAll() {
    clearAllLocalData();
    setConfirmClearAll(false);
    refresh();
  }

  return (
    <div className="ldr-root" data-tick={tick}>
      <div className="ps-gdprCardHead" style={{ marginBottom: "0.75rem" }}>
        <div>
          <p className="ps-gdprCardTitle">What's in your browser</p>
          <p className="ps-gdprCardDesc">
            Room reflections, conversations, and mechanic outputs are stored locally on this
            device. They never reach our servers unless you explicitly grant server consent above.
            {firstSaved && (
              <> First saved {fmtDate(firstSaved)}.</>
            )}
          </p>
        </div>
      </div>

      <div className="ldr-rooms">
        {ROOM_KEYS.map((k) => (
          <RoomCard key={k} roomKey={k} roomData={allRooms[k]} onRefresh={refresh} />
        ))}
      </div>

      {measureResult && (
        <div className="ldr-room-card ldr-room-card--measure">
          <div className="ldr-room-head">
            <span className="ldr-room-label">Measure result</span>
            <span className="ldr-visit-date">{fmtDate(measureResult.date ?? measureResult.completedAt)}</span>
          </div>
          <p className="ldr-muted" style={{ marginTop: "0.5rem" }}>
            Your most recent self-assessment result is stored locally.
          </p>
        </div>
      )}

      {hasAnyData && (
        <div className="ldr-clear-all-row">
          {!confirmClearAll ? (
            <button
              type="button"
              className="ps-gdprBtn ps-gdprBtn--danger"
              onClick={() => setConfirmClearAll(true)}
            >
              Clear all browser data
            </button>
          ) : (
            <span className="ldr-confirm-delete ldr-confirm-delete--block">
              This will delete all room visits and local reflections permanently.{" "}
              <button type="button" className="ldr-confirm-yes" onClick={handleClearAll}>
                Yes, clear everything
              </button>
              <button type="button" className="ldr-confirm-no" onClick={() => setConfirmClearAll(false)}>
                Cancel
              </button>
            </span>
          )}
        </div>
      )}

      {!hasAnyData && (
        <p className="ldr-muted" style={{ marginTop: "0.5rem" }}>
          No room data stored yet. Complete a room to see your reflections here.
        </p>
      )}
    </div>
  );
}
