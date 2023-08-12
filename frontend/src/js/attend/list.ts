import { anchor, appendChild, listItem } from '../dom';
import { attendURI, fetchRooms } from '../fetchRooms';

const createRoomLink = (id: string, label: string): HTMLLIElement =>
  listItem([
    anchor(attendURI(id), [label], ['text-blue-600', 'hover:underline', 'text-xl']),
    // ' [',
    // anchor(castURI(id), 'Cast'),
    // ']',
  ]);

const run = async () => {
  const roomList = document.getElementById('room-list');

  const appendChildToRoomList = appendChild(roomList);

  const roomsResponse = await fetchRooms();

  if (!roomsResponse.ok) {
    alert('Could not get rooms. Try again.');
    return;
  }

  for (const { id, name } of roomsResponse.rooms) {
    appendChildToRoomList(createRoomLink(id, name));
  }
};

run().catch((err) => console.error('Failed somewhere', err));
