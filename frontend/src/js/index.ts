import { castURI, fetchRooms, viewerURI } from './fetchRooms';

const createLink = (href: string, label: string): HTMLAnchorElement => {
  const link = document.createElement('a');
  link.setAttribute('href', href);
  link.innerText = label;
  return link;
};

export const createRoomLink =
  (within: HTMLElement) =>
  (id: string, label: string): void => {
    const base = document.createElement('li');
    base.appendChild(createLink(viewerURI(id), label));
    base.appendChild(document.createTextNode(' ['));
    base.appendChild(createLink(castURI(id), 'Cast'));
    base.appendChild(document.createTextNode(']'));
    within.append(base);
  };

const run = async () => {
  const roomList = document.getElementById('room-list');

  const roomLink = createRoomLink(roomList);

  const roomsResponse = await fetchRooms();

  if (!roomsResponse.ok) {
    alert('Could not get rooms. Try again.');
    return;
  }

  for (const { id, name } of roomsResponse.rooms) {
    roomLink(id, name);
  }
};

run().catch((err) => console.error('Failed somewhere', err));
