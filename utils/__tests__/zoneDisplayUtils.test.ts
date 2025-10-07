/**
 * Test cases for zone display utility
 */
import { getDisplayZone } from '../zoneDisplayUtils';

describe('getDisplayZone', () => {
  describe('Southeast Asia mapping', () => {
    it('should display "Southeast Asia" for Indochina Interior region name', () => {
      expect(getDisplayZone('South Asia', 'Indochina Interior')).toBe('Southeast Asia');
    });

    it('should display "Southeast Asia" for Mekong River Basin', () => {
      expect(getDisplayZone('South Asia', 'Mekong River Basin')).toBe('Southeast Asia');
    });

    it('should display "Southeast Asia" for Central Java', () => {
      expect(getDisplayZone('South Asia', 'Central Java')).toBe('Southeast Asia');
    });

    it('should display "Southeast Asia" for Manila Bay', () => {
      expect(getDisplayZone('South Asia', 'Manila Bay')).toBe('Southeast Asia');
    });

    it('should display "Southeast Asia" for Strait of Malacca', () => {
      expect(getDisplayZone('South Asia', 'Strait of Malacca')).toBe('Southeast Asia');
    });

    it('should display "Southeast Asia" for Angkor region', () => {
      expect(getDisplayZone('South Asia', 'Angkor Region')).toBe('Southeast Asia');
    });
  });

  describe('Australia mapping', () => {
    it('should display "Australia" for Kimberley', () => {
      expect(getDisplayZone('Oceania', 'Kimberley')).toBe('Australia');
    });

    it('should display "Australia" for Great Barrier Reef', () => {
      expect(getDisplayZone('Oceania', 'Great Barrier Reef')).toBe('Australia');
    });

    it('should display "Australia" for Sydney Basin', () => {
      expect(getDisplayZone('Oceania', 'Sydney Basin')).toBe('Australia');
    });

    it('should display "Australia" for Australian Outback', () => {
      expect(getDisplayZone('Oceania', 'Australian Outback')).toBe('Australia');
    });
  });

  describe('South Asian regions (unchanged)', () => {
    it('should keep "South Asia" for Bengal Delta', () => {
      expect(getDisplayZone('South Asia', 'Bengal Delta')).toBe('South Asia');
    });

    it('should keep "South Asia" for Punjab Plains', () => {
      expect(getDisplayZone('South Asia', 'Punjab Plains')).toBe('South Asia');
    });

    it('should keep "South Asia" for Deccan Plateau', () => {
      expect(getDisplayZone('South Asia', 'Deccan Plateau')).toBe('South Asia');
    });
  });

  describe('Antarctica mapping', () => {
    it('should display "Antarctica" for Antarctic Peninsula', () => {
      expect(getDisplayZone('Oceania', 'Antarctic Peninsula')).toBe('Antarctica');
    });

    it('should display "Antarctica" for Ross Sea', () => {
      expect(getDisplayZone('Oceania', 'Ross Sea')).toBe('Antarctica');
    });

    it('should display "Antarctica" for Antarctica region', () => {
      expect(getDisplayZone('Oceania', 'Antarctica')).toBe('Antarctica');
    });

    it('should display "Antarctica" for South Pole', () => {
      expect(getDisplayZone('Oceania', 'South Pole')).toBe('Antarctica');
    });
  });

  describe('Pacific Island regions (unchanged)', () => {
    it('should keep "Oceania" for Society Islands', () => {
      expect(getDisplayZone('Oceania', 'Society Islands')).toBe('Oceania');
    });

    it('should keep "Oceania" for Fiji', () => {
      expect(getDisplayZone('Oceania', 'Fiji')).toBe('Oceania');
    });

    it('should keep "Oceania" for New Zealand', () => {
      expect(getDisplayZone('Oceania', 'Canterbury Plain')).toBe('Oceania');
    });
  });

  describe('Central Asia mapping', () => {
    it('should display "Central Asia" for Central Asian Oases region name', () => {
      expect(getDisplayZone('East Asia', 'Central Asian Oases')).toBe('Central Asia');
    });

    it('should display "Central Asia" for Samarkand Region', () => {
      expect(getDisplayZone('East Asia', 'Samarkand Region')).toBe('Central Asia');
    });

    it('should display "Central Asia" for Kazakh Steppes', () => {
      expect(getDisplayZone('East Asia', 'Kazakh Steppes')).toBe('Central Asia');
    });

    it('should display "Central Asia" for Ferghana Valley', () => {
      expect(getDisplayZone('East Asia', 'Ferghana Valley')).toBe('Central Asia');
    });

    it('should display "Central Asia" for Pamir Mountains', () => {
      expect(getDisplayZone('East Asia', 'Pamir Mountains')).toBe('Central Asia');
    });

    it('should display "Central Asia" for Transoxiana', () => {
      expect(getDisplayZone('East Asia', 'Transoxiana')).toBe('Central Asia');
    });
  });

  describe('East Asian regions (unchanged)', () => {
    it('should keep "East Asia" for Sichuan Basin', () => {
      expect(getDisplayZone('East Asia', 'Sichuan Basin')).toBe('East Asia');
    });

    it('should keep "East Asia" for Yellow River Valley', () => {
      expect(getDisplayZone('East Asia', 'Yellow River Valley')).toBe('East Asia');
    });

    it('should keep "East Asia" for Korean Peninsula', () => {
      expect(getDisplayZone('East Asia', 'Han River Valley')).toBe('East Asia');
    });
  });

  describe('Mesoamerica mapping', () => {
    it('should display "Mesoamerica" for Valley of Mexico', () => {
      expect(getDisplayZone('North America', 'Valley of Mexico')).toBe('Mesoamerica');
    });

    it('should display "Mesoamerica" for Yucatán Peninsula', () => {
      expect(getDisplayZone('North America', 'Yucatán Peninsula')).toBe('Mesoamerica');
    });

    it('should display "Mesoamerica" for Oaxaca Highlands', () => {
      expect(getDisplayZone('North America', 'Oaxaca Highlands')).toBe('Mesoamerica');
    });

    it('should display "Mesoamerica" for Mayan Lowlands', () => {
      expect(getDisplayZone('North America', 'Mayan Lowlands')).toBe('Mesoamerica');
    });

    it('should display "Mesoamerica" for Lake Texcoco Basin', () => {
      expect(getDisplayZone('North America', 'Lake Texcoco Basin')).toBe('Mesoamerica');
    });
  });

  describe('North American regions (unchanged)', () => {
    it('should keep "North America" for Great Plains', () => {
      expect(getDisplayZone('North America', 'Great Plains')).toBe('North America');
    });

    it('should keep "North America" for Hudson Bay', () => {
      expect(getDisplayZone('North America', 'Hudson Bay')).toBe('North America');
    });

    it('should keep "North America" for Baja California', () => {
      expect(getDisplayZone('North America', 'Baja California')).toBe('North America');
    });

    it('should keep "North America" for Pacific Northwest', () => {
      expect(getDisplayZone('North America', 'Columbia River Valley')).toBe('North America');
    });
  });

  describe('Other zones (pass through unchanged)', () => {
    it('should pass through Europe', () => {
      expect(getDisplayZone('Europe', 'Thames Valley')).toBe('Europe');
    });

    it('should pass through MENA', () => {
      expect(getDisplayZone('MENA', 'Nile Delta')).toBe('MENA');
    });
  });
});
