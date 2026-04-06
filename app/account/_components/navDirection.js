'use client';

let lastDirection = 1;

export function setAccountNavDirection(direction) {
  lastDirection = direction === -1 ? -1 : 1;
}

export function getAccountNavDirection() {
  return lastDirection;
}

