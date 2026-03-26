# Project 724

# Entities
> [!NOTE]
> ATTRIBUTE **:arrow_right** VALUE
> is read ATTRIBUTE as VALUE

### Resident:
* Id : (int)
* FirstName : (string)
* MiddleName : (string)
* LastName : (string)
* Suffix : (string)
* BirthDate : (DateOnly)
* Age : (int)
* Sector : (int)
    * General :arrow_right 0
    * Senior :arrow_right 1
    * PWD :arrow_right 2
* Sex : (int)
    * Male :arrow_right 0
    * Female :arrow_right 1
* CivilStatus : (int)
    * Single :arrow_right 0
    * Married :arrow_right 1
    * Widowed :arrow_right 2
    * Divorced :arrow_right 3
    * Annulled :arrow_right 4
    * LegallySeparated :arrow_right 5
* Address : (string)

# API

## Endpoints

### All Residents
* Endpoint: `GET /residents`

### Filter Residents
* Endpoint: `GET /residents/filter[?params]`
* Parameters:
|Parameter|Type|Required?|Default|Description|
|`minAge`|int|no|null|Returns residents with ages above set value|
|`maxAge`|int|no|null|Returns residents with ages below set value|
|`sex`|string\|int|no|null|Filter by sex, pass multiple values as `sex=male&sex=female`|
|`sector`|string\|int|no|null|Filter by sector or vulnerability, pass multiple values as `sector=pwd&sector=senior`|
|`civilStat`|string\|int|no|null|Filter by civil status, pass multiple values as `civilStat=single&civilStat=married`|
|`from`|int|no|0|The starting index of entries to return base on `orderBy`|
|`limit`|int|no|50|The max number of entries to return base on `orderBy`|

### Add Resident
* Endpoint: `POST /residents}`
* Request Body: (to be added)
* Response Body: (to be added)

### Update Resident
* Endpoint: `PUT /residents/{id}`
* Request Body: (to be added)
* Response Body: (to be added)

### Remove Resident
* Endpoint: `DELETE /residents/{id}`
* Request Body: (to be added)
* Response Body: (to be added)
