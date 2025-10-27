import { Injectable } from '@nestjs/common';

@Injectable()
export class CharacterService {
  async findAll() {
    return {
      characters: [
        { id: '1', name: 'Cheerful Companion', persona: 'cheerful' },
        { id: '2', name: 'Cool Mentor', persona: 'cool' },
        { id: '3', name: 'Cute Assistant', persona: 'cute' },
      ],
    };
  }
}
