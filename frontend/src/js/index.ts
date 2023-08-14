import { anchor, appendChild, listItem } from './dom';
import { castURI, fetchRooms, viewerURI } from './fetchRooms';
import { AccessDenied } from './helpers/AccessDenied';
import { isFailure, successValue } from './helpers/result';

const createRoomLink = (id: string, label: string): HTMLLIElement =>
  listItem([anchor(viewerURI(id), [label]), ' [', anchor(castURI(id), 'Cast'), ']']);

const run = async () => {
  const roomList = document.getElementById('room-list');

  const appendChildToRoomList = appendChild(roomList);

  const roomsResponse = await fetchRooms();

  if (isFailure(roomsResponse)) {
    if (roomsResponse.value instanceof AccessDenied) {
      window.location.href = '/access-denied.html';
      return;
    }
    alert('Could not get rooms. Try again.');
    return;
  }

  const rooms = successValue(roomsResponse);

  for (const { id, name } of rooms) {
    appendChildToRoomList(createRoomLink(id, name));
  }

  appendChildToRoomList(listItem([anchor('all.html', 'Multiview')]));
};

run().catch((err) => console.error('Failed somewhere', err));
