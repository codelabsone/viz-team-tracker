import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Team } from '../models/team.model';
import { TeamService } from '../team.service';
import { FormGroup, FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { AddMemberDialogData } from '../interfaces/add-member-dialog-data.interface';
import { PicsumService } from '../picsum.service';
import { PicsumPhoto } from '../interfaces/picsum-photo.interface';
import { Picture } from '../models/picture.model';
import { PageEvent, MatPaginator } from '@angular/material';
import { Teammember } from '../models/member.model';
import { MemberFromApi } from '../models/memberFromApi.model';

export interface DialogData {

  name: string;
  jobtitle: string;
  email: string;
  avatar: string;
  id: number;
}

@Component({
  selector: 'app-add-new-member-dialog',
  templateUrl: './add-new-member-dialog.component.html',
  styleUrls: ['./add-new-member-dialog.component.scss']
})
export class AddNewMemberDialogComponent implements OnInit {
  possibleJobTitles: string[] = ['Quality Engineer', 'Software Engineer', 'UX Engineer'];
  team: Team;
  member: Teammember;
  images: Picture[] = [];
  firstImage: number = 0;
  lastImage: number = 5;
  selectedImage: Picture;
  selectedTeam: Team;

  memberForm: FormGroup = new FormGroup({
    pathToPhoto: new FormControl(''),
    firstName: new FormControl('', [Validators.required, Validators.pattern('.*\S+.*')]),
    lastName: new FormControl('', [Validators.required, Validators.pattern('.*\S+.*')]),
    title: new FormControl('', [Validators.required, Validators.pattern('.*\S+.*')]),
    team: new FormControl('', [Validators.required, Validators.pattern('.*\S+.*')])
  });


  constructor(
    public dialogRef: MatDialogRef<AddNewMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMemberDialogData,
    private teamservice: TeamService,
    private picsumService: PicsumService 
    ) { }

  ngOnInit() {

    this.data.allTeams = this.data.allTeams.filter(data => data.id !== this.data.team.id);
    this.data.allTeams.forEach(team => {
      team.members.forEach(member => {
        if (!this.possibleJobTitles.includes(member.jobtitle)) {
          this.possibleJobTitles.push(member.jobtitle)
        }
      });
    });
    
    
    this.memberForm.get('team').setValue(this.data.team.id);
    
    this.teamservice.selectedTeam.subscribe(data => {
      this.selectedTeam = data;
    });
    

    this.picsumService.getImages(1, 100).subscribe((picsumPhotos: PicsumPhoto[]) => {
      picsumPhotos.forEach((photo: PicsumPhoto) => {
        this.images.push(new Picture(photo.id));
      });
    });

    if (this.data.member !== null) {
      this.member = this.data.member;
      if (this.member.avatar !== '') {
        this.images.unshift(this.member.createPictureFromUrl());
        this.setSelectedPic(this.images[0]);
      }
    }

    this.memberForm.get('firstName').setValue(this.member.name.split(' ')[0]);
    if (this.member.name.split(' ').length === 1) this.memberForm.get('lastName').setValue('');
    else this.memberForm.get('lastName').setValue(this.member.name.split(' ')[1]);
  }

  setPagedPhotos(event: PageEvent, matPaginator: MatPaginator) {
    const pageIndex = matPaginator.pageIndex * matPaginator.pageSize;
    this.firstImage = pageIndex;
    this.lastImage = 5 + pageIndex;
  }

  close() {
    this.dialogRef.close();
  }

  setSelectedPic(image: Picture) {
    this.selectedImage = image;
  }

  addMember(memberForm: FormGroup, photo: Picture) {
    const member = {
      firstName: memberForm.get('firstName').value.trim(),
      lastName: memberForm.get('lastName').value.trim(),
      title: memberForm.get('title').value,
      pathToPhoto: photo.url,
      team: memberForm.get('team').value,
      id: this.data.member.id
    };

    if (memberForm.get('firstName').value.trim() !== '' && memberForm.get('lastName').value.trim() !== '' && memberForm.get('title').value.trim() !== '') {
      if (this.data.method === 'add') {
        this.teamservice.addMember(member).subscribe(data => {
          this.teamservice.refreshTeams();
          this.close()
        });
      }
      if (this.data.method === 'edit') {
        const memberToSend: MemberFromApi = {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          title: member.title,
          pathToPhoto: photo.url,
          teamId: member.team
        }
        this.teamservice.updateMember(memberToSend).subscribe(data => {
          this.teamservice.refreshTeams();
          this.close()
        });
      }
    } else {
        if (this.memberForm.get('firstName').value.trim() == '') {
          this.memberForm.get('firstName').setErrors({required: true});
          this.memberForm.get('firstName').setValue('');
        }

        if (this.memberForm.get('lastName').value.trim() == '') {
          this.memberForm.get('lastName').setErrors({required: true});
          this.memberForm.get('lastName').setValue('');
        }
      }
  }

}
