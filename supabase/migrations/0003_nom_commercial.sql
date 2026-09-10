-- Ajoute le nom du commercial (distinct du nom de la concession)
alter table profil add column nom_commercial text not null default '';
