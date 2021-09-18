import { anchor, appendChild, listItem } from './dom';
import { castURI, fetchRooms, viewerURI } from './fetchRooms';

const createRoomLink = (id: string, label: string): HTMLLIElement =>
  listItem([anchor(viewerURI(id), [label]), ' [', anchor(castURI(id), 'Cast'), ']']);

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

  appendChildToRoomList(listItem([anchor('all.html', 'Multiview')]));
};

run().catch((err) => console.error('Failed somewhere', err));
