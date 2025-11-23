-- Switch check-in to dynamic, time-bound tokens by storing secrets instead of static codes
ALTER TABLE `ClassBooking` DROP INDEX `ClassBooking_checkinCode_key`;

ALTER TABLE `ClassBooking` ADD COLUMN `checkinSecret` VARCHAR(191) NULL;

UPDATE `ClassBooking`
SET `checkinSecret` = REPLACE(UUID(), '-', '')
WHERE `checkinSecret` IS NULL;

ALTER TABLE `ClassBooking` MODIFY `checkinSecret` VARCHAR(191) NOT NULL;

ALTER TABLE `ClassBooking` DROP COLUMN `checkinCode`;
